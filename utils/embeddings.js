const axios = require("axios");

async function createEmbedding(input) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY missing");
  }

  const response = await axios.post(
    "https://openrouter.ai/api/v1/embeddings",
    {
      model: "openai/text-embedding-3-small",
      input
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://parahelper.app",
        "X-Title": "ParaHelper"
      }
    }
  );

  return response.data.data[0].embedding;
}

module.exports = { createEmbedding };
