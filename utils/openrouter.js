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
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "https://parahelper.app",
        "X-Title": process.env.OPENROUTER_APP_TITLE || "ParaHelper"
      },
      timeout: 60000
    }
  );

  return response.data.choices[0].message.content;
}

module.exports = { chatCompletion };
