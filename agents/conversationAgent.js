const { chatCompletion } = require("../utils/openrouter");

function detectStressMode(text) {
  const stressKeywords = ["code", "sirens", "unconscious", "cardiac", "shock", "cpr", "trauma"];
  return stressKeywords.some((word) => text.toLowerCase().includes(word));
}

function buildSystemPrompt({ paramedic, mode, tone }) {
  const base =
    "You are ParaHelper, a human, empathetic AI shift buddy for paramedics. Speak naturally like a trusted colleague, use contractions, and match the user's tone. Keep responses warm but professional. Use the paramedic's first name when appropriate. Ask brief clarifying questions only when needed. Avoid asking for info already known. Keep responses grounded and practical.";
  const modePrompt =
    mode === "stress"
      ? "Stress mode: be calm, concise, directive, and no fluff. Use short sentences, clear next steps, and confirm critical details. Keep it human, not robotic."
      : "Normal mode: conversational, supportive, and friendly. Offer brief encouragement, natural phrasing, and actionable guidance.";
  const tonePrompt = tone
    ? `Tone mirroring: match the user's style (${tone}). Keep accuracy high and never use offensive language.`
    : "Tone mirroring: match the user's style. Keep accuracy high and never use offensive language.";
  const guardrails =
    "You are not a replacement for medical direction. Provide protocol-based guidance and suggest escalation when needed.";
  return `${base}\n${modePrompt}\n${tonePrompt}\n${guardrails}\nParamedic: ${paramedic.first_name} (${paramedic.role})`;
}

async function generateReply({ message, paramedic, knowledgeAnswer, summary, tone }) {
  const mode = detectStressMode(message) ? "stress" : "normal";
  console.log(`[conversationAgent] mode=${mode}`);

  const system = buildSystemPrompt({ paramedic, mode, tone });
  const contextNote = summary ? `Conversation summary:\n${summary}` : "";
  const knowledgeNote = knowledgeAnswer ? `Knowledge:\n${knowledgeAnswer}` : "";

  const prompt = [
    { role: "system", content: system },
    { role: "user", content: `${contextNote}\n${knowledgeNote}\nUser: ${message}`.trim() }
  ];

  const model =
    mode === "stress"
      ? "google/gemini-2.5-flash"
      : "google/gemini-2.0-flash-lite-001";

  try {
    const reply = await chatCompletion({ model, messages: prompt });
    return { reply, mode };
  } catch (error) {
    const detail = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message;
    console.error("[conversationAgent] chatCompletion failed", detail);
    const fallback =
      "I couldn't reach my AI engine just now, but I'm still here. Try again in a moment, or check that the backend API key is configured.";
    return { reply: fallback, mode };
  }
}

module.exports = { generateReply, detectStressMode };
