const express = require("express");
const { v4: uuid } = require("uuid");
const { getDb } = require("../utils/mongodb");
const { cleanTranscription } = require("../agents/transcriptionCleaner");
const { extractData } = require("../agents/extractionAgent");
const { validateAll } = require("../agents/guardrailAgent");
const { answerQuery } = require("../agents/knowledgeAgent");
const { generateReply } = require("../agents/conversationAgent");
const { summarizeConversation } = require("../agents/summarizerAgent");
const { handleAdminTask } = require("../agents/adminAgent");
const { textToSpeech } = require("../utils/tts");

const router = express.Router();

function shouldUseKnowledge(text) {
  const keywords = [
    "dose",
    "protocol",
    "treatment",
    "weather",
    "hospital",
    "schedule",
    "shift",
    "compliance",
    "certification"
  ];
  return keywords.some((k) => text.toLowerCase().includes(k));
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
    const { forms, extracted } = extractData(cleaned);
    const guardrails = validateAll(extracted);

    const adminResponse = await handleAdminTask({ text: cleaned, paramedic });
    const knowledgeAnswer = shouldUseKnowledge(cleaned)
      ? await answerQuery({ text: cleaned, paramedic })
      : "";

    const convoId = conversation_id || uuid();
    const messagesCollection = convoDb.collection("messages");

    await messagesCollection.insertOne({
      conversation_id: convoId,
      paramedic_id,
      role: "user",
      content: cleaned,
      created_at: new Date()
    });

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
            updated_at: new Date()
          }
        },
        { upsert: true }
      );
    }

    const { reply, mode } = adminResponse
      ? { reply: adminResponse, mode: "normal" }
      : await generateReply({ message: cleaned, paramedic, knowledgeAnswer, summary });

    await messagesCollection.insertOne({
      conversation_id: convoId,
      paramedic_id,
      role: "assistant",
      content: reply,
      created_at: new Date()
    });

    const audioUrl = await textToSpeech(reply);

    res.json({
      ok: true,
      conversation_id: convoId,
      reply,
      mode,
      forms,
      extracted,
      guardrails,
      knowledge: knowledgeAnswer,
      audio_url: audioUrl
    });
  } catch (error) {
    console.error("[chat] message failed", error);
    res.status(500).json({ ok: false, message: "Chat failed" });
  }
});

module.exports = router;
