const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const EXPORT_DIR = path.join(__dirname, "..", "exports");

async function textToSpeech(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    return null;
  }

  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      text,
      model_id: "eleven_flash_v2"
    },
    {
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      responseType: "arraybuffer"
    }
  );

  const filename = `tts_${uuid()}.mp3`;
  const filePath = path.join(EXPORT_DIR, filename);
  fs.writeFileSync(filePath, response.data);
  return `/exports/${filename}`;
}

module.exports = { textToSpeech };
