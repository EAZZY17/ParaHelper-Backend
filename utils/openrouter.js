const axios = require("axios");

async function chatCompletion({ model, messages, temperature = 0.4 }) {
  const rawKey = process.env.OPENROUTER_API_KEY;
  const apiKey = typeof rawKey === "string" ? rawKey.trim() : "";
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
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "https://parahelper.app",
        "X-Title": process.env.OPENROUTER_APP_TITLE || "ParaHelper"
      },
      timeout: 60000,
      validateStatus: () => true
    }
  );

  if (response.status !== 200) {
    const err = new Error(response.data?.error?.message || `OpenRouter ${response.status}`);
    err.response = { data: response.data, status: response.status };
    throw err;
  }

  const data = response.data;
  if (data.error) {
    const err = new Error(data.error.message || JSON.stringify(data.error));
    err.response = { data };
    throw err;
  }
  const content = data?.choices?.[0]?.message?.content;
  if (content != null && typeof content === "string") {
    return content.trim() || "(No response.)";
  }
  return "(No response from model.)";
}

module.exports = { chatCompletion };
