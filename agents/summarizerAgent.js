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
<<<<<<< HEAD
    model: "google/gemini-2.0-flash-lite-001",
=======
    model: "google/gemini-2.5-flash",
>>>>>>> 4546a3093aa40de5b41473cd1a7a2ab642ee4756
    messages: prompt,
    temperature: 0.2
  });

  return summary;
}

module.exports = { summarizeConversation };
