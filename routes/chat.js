const express = require("express");
const { v4: uuid } = require("uuid");
const { getDb } = require("../utils/mongodb");
const { cleanTranscription } = require("../agents/transcriptionCleaner");
const { extractData } = require("../agents/extractionAgent");
const { validateAll } = require("../agents/guardrailAgent");
const {
  isAffirmative,
  isNegative,
  applyAnswerToField,
  getNextMissingField,
  getQuestion,
  buildConfirmationMessage
} = require("../agents/formDialogueAgent");
const { exportForms } = require("../agents/exportAgent");
const { answerQuery } = require("../agents/knowledgeAgent");
const { generateReply } = require("../agents/conversationAgent");
const { summarizeConversation } = require("../agents/summarizerAgent");
const { handleAdminTask } = require("../agents/adminAgent");
const { textToSpeech } = require("../utils/tts");
const { detectTone } = require("../agents/toneAgent");

const router = express.Router();

function shouldUseKnowledge() {
  // Always consult the knowledge layer so replies stay grounded
  // in the stored protocols, operations data, and Chroma content.
  return true;
}

router.post("/message", async (req, res) => {
  try {
    const { paramedic_id, message, isVoice, conversation_id } = req.body;
    const usersDb = getDb("parahelper_users");
    const convoDb = getDb("parahelper_conversations");

    const paramedic = await usersDb.collection("paramedics").findOne({ paramedic_id });
    if (!paramedic) {
      return res.status(404).json({ ok: false, message: "Paramedic not found" });
    }

    const cleaned = isVoice ? cleanTranscription(message) : message;
    const convoId = conversation_id || uuid();
    const conversationsCollection = convoDb.collection("conversations");
    const messagesCollection = convoDb.collection("messages");
    const existingConversation = await conversationsCollection.findOne({ conversation_id: convoId });
    const pending = existingConversation?.pending || null;
    const previousTone = existingConversation?.tone;
    const detectedTone = detectTone(cleaned);
    const tone = detectedTone === "neutral" ? previousTone || "neutral" : detectedTone;

    await messagesCollection.insertOne({
      conversation_id: convoId,
      paramedic_id,
      role: "user",
      content: cleaned,
      created_at: new Date()
    });

    const flattenFields = (formFields) => {
      const output = {};
      Object.entries(formFields || {}).forEach(([key, value]) => {
        output[key] = value?.value ?? value;
      });
      return output;
    };

    const respondWith = async (reply, extra = {}) => {
      await messagesCollection.insertOne({
        conversation_id: convoId,
        paramedic_id,
        role: "assistant",
        content: reply,
        created_at: new Date()
      });
      const audioUrl = await textToSpeech(reply, tone);
      res.json({
        ok: true,
        conversation_id: convoId,
        reply,
        audio_url: audioUrl,
        ...extra
      });
    };

    if (pending) {
      const activeForm = pending.active_form;
      if (pending.awaiting_confirmation) {
        if (isAffirmative(cleaned)) {
          const flattenedForms = {};
          pending.forms_queue.forEach((formKey) => {
            flattenedForms[formKey] = flattenFields(pending.forms[formKey]);
          });
          const exportResult = await exportForms({ paramedic, forms: flattenedForms });
          await conversationsCollection.updateOne(
            { conversation_id: convoId },
            { $set: { pending: null, updated_at: new Date() } }
          );
          return respondWith("Sent! Your forms have been emailed.", {
            forms: pending.forms_queue,
            extracted: pending.forms,
            guardrails: validateAll(pending.forms),
            export: exportResult
          });
        }
        if (isNegative(cleaned)) {
          await conversationsCollection.updateOne(
            { conversation_id: convoId },
            { $set: { "pending.awaiting_confirmation": false, updated_at: new Date() } }
          );
          return respondWith("No problem. What would you like to change?");
        }
      }

      if (pending.awaiting_field && activeForm) {
        const updated = { ...pending };
        const applied = applyAnswerToField(activeForm, pending.awaiting_field, cleaned);
        updated.forms[activeForm] = {
          ...updated.forms[activeForm],
          [pending.awaiting_field]: applied
        };
        updated.awaiting_field = "";

        const guardrails = validateAll(updated.forms);
        const nextMissing = getNextMissingField(guardrails, activeForm);
        if (nextMissing) {
          updated.awaiting_field = nextMissing;
          await conversationsCollection.updateOne(
            { conversation_id: convoId },
            { $set: { pending: updated, updated_at: new Date() } }
          );
          return respondWith(getQuestion(activeForm, nextMissing, tone), {
            forms: updated.forms_queue,
            extracted: updated.forms,
            guardrails,
            pending: updated
          });
        }

        const remainingForms = updated.forms_queue.filter((key) => key !== activeForm);
        if (remainingForms.length) {
          updated.active_form = remainingForms[0];
          const nextFormMissing = getNextMissingField(guardrails, updated.active_form);
          if (nextFormMissing) {
            updated.awaiting_field = nextFormMissing;
            await conversationsCollection.updateOne(
              { conversation_id: convoId },
              { $set: { pending: updated, updated_at: new Date() } }
            );
            return respondWith(getQuestion(updated.active_form, nextFormMissing, tone), {
              forms: updated.forms_queue,
              extracted: updated.forms,
              guardrails,
              pending: updated
            });
          }
        }

        updated.awaiting_confirmation = true;
        await conversationsCollection.updateOne(
          { conversation_id: convoId },
          { $set: { pending: updated, updated_at: new Date() } }
        );
        return respondWith(buildConfirmationMessage(updated.forms_queue), {
          forms: updated.forms_queue,
          extracted: updated.forms,
          guardrails,
          pending: updated
        });
      }
    }

    const { forms, extracted } = extractData(cleaned, paramedic);
    const guardrails = validateAll(extracted);

    const adminResponse = await handleAdminTask({ text: cleaned, paramedic });
    const knowledgeAnswer = shouldUseKnowledge()
      ? await answerQuery({ text: cleaned, paramedic })
      : "";

    const formKeys = forms.filter((key) => ["occurrence_report", "teddy_bear"].includes(key));
    if (formKeys.length) {
      const pendingState = {
        forms: extracted,
        forms_queue: formKeys,
        active_form: formKeys[0],
        awaiting_field: "",
        awaiting_confirmation: false
      };

      const nextMissing = getNextMissingField(guardrails, pendingState.active_form);
      if (nextMissing) {
        pendingState.awaiting_field = nextMissing;
        await conversationsCollection.updateOne(
          { conversation_id: convoId },
          {
            $set: {
              conversation_id: convoId,
              paramedic_id,
              pending: pendingState,
              tone,
              updated_at: new Date()
            }
          },
          { upsert: true }
        );
        const intro =
          pendingState.forms_queue.length > 1
            ? "I can file both forms. Let's start with the Occurrence Report."
            : "Got it. Let's get this form filed.";
        return respondWith(`${intro} ${getQuestion(pendingState.active_form, nextMissing, tone)}`, {
          forms,
          extracted,
          guardrails,
          pending: pendingState
        });
      }

      pendingState.awaiting_confirmation = true;
      await conversationsCollection.updateOne(
        { conversation_id: convoId },
        {
          $set: {
            conversation_id: convoId,
            paramedic_id,
            pending: pendingState,
            tone,
            updated_at: new Date()
          }
        },
        { upsert: true }
      );
      return respondWith(buildConfirmationMessage(pendingState.forms_queue), {
        forms,
        extracted,
        guardrails,
        pending: pendingState
      });
    }

    let summary = "";
    const count = await messagesCollection.countDocuments({ conversation_id: convoId });
    if (count % 15 === 0) {
      const recent = await messagesCollection
        .find({ conversation_id: convoId })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray();
      summary = await summarizeConversation(recent.reverse());
      await convoDb.collection("conversations").updateOne(
        { conversation_id: convoId },
        {
          $set: {
            conversation_id: convoId,
            paramedic_id,
            summary,
            tone,
            updated_at: new Date()
          }
        },
        { upsert: true }
      );
    }

    const { reply, mode } = adminResponse
      ? { reply: adminResponse, mode: "normal" }
      : await generateReply({ message: cleaned, paramedic, knowledgeAnswer, summary, tone });

    return respondWith(reply, {
      mode,
      forms,
      extracted,
      guardrails,
      knowledge: knowledgeAnswer
    });
  } catch (error) {
    console.error("[chat] message failed", error);
    res.status(500).json({ ok: false, message: "Chat failed" });
  }
});

module.exports = router;
