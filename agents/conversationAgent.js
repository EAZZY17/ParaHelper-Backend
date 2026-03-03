const { chatCompletion } = require("../utils/openrouter");

function detectStressMode(text) {
  const stressKeywords = ["code", "sirens", "unconscious", "cardiac", "shock", "cpr", "trauma"];
  return stressKeywords.some((word) => text.toLowerCase().includes(word));
}

function buildSystemPrompt({ paramedic, mode }) {
  const base = `You are ParaHelper, a friendly AI shift buddy for paramedics. Use the paramedic's first name. Avoid asking for info already known.`;
  const modePrompt =
    mode === "stress"
      ? "Stress mode: responses must be short, directive, and no fluff."
      : "Normal mode: conversational, supportive, and friendly.";
  const guardrails =
    "You are not a replacement for medical direction. Provide protocol-based guidance and suggest escalation when needed.";
  return `${base}\n${modePrompt}\n${guardrails}\nParamedic: ${paramedic.first_name} (${paramedic.role})`;
}

async function generateReply({ message, paramedic, knowledgeAnswer, summary }) {
  const mode = detectStressMode(message) ? "stress" : "normal";
  console.log(`[conversationAgent] mode=${mode}`);

  const system = buildSystemPrompt({ paramedic, mode });
  const contextNote = summary ? `Conversation summary:\n${summary}` : "";
  const knowledgeNote = knowledgeAnswer ? `Knowledge:\n${knowledgeAnswer}` : "";

  const prompt = [
    { role: "system", content: system },
    { role: "user", content: `${contextNote}\n${knowledgeNote}\nUser: ${message}`.trim() }
  ];

  const model =
    mode === "stress"
      ? "google/gemini-flash-1.5"
      : "anthropic/claude-sonnet-4-20250514";

  const reply = await chatCompletion({ model, messages: prompt });
  return { reply, mode };
}

module.exports = { generateReply, detectStressMode };
