const axios = require("axios");

async function chatCompletion({ model, messages, temperature = 0.4 }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY missing");
  }

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model,
      messages,
      temperature
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://parahelper.app",
        "X-Title": "ParaHelper"
      }
    }
  );

  return response.data.choices[0].message.content;
}

module.exports = { chatCompletion };
