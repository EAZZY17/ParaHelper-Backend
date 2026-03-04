const { chatCompletion } = require("../utils/openrouter");

async function summarizeConversation(messages) {
  console.log("[summarizerAgent] summarizing");
  const prompt = [
    {
      role: "system",
      content:
        "Summarize the conversation in 6-8 bullet points, focusing on medical events, tasks, and forms."
    },
    {
      role: "user",
      content: messages.map((m) => `${m.role}: ${m.content}`).join("\n")
    }
  ];

  const summary = await chatCompletion({
    model: "google/gemini-2.0-flash-lite-001",
    messages: prompt,
    temperature: 0.2
  });

  return summary;
}

module.exports = { summarizeConversation };
