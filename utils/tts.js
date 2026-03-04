const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const EXPORT_DIR = path.join(__dirname, "..", "exports");

function voiceSettingsForTone(tone) {
  if (tone === "stressed/short") {
    return { stability: 0.2, similarity_boost: 0.7, style: 0.6, use_speaker_boost: true };
  }
  if (tone === "casual/slang") {
    return { stability: 0.35, similarity_boost: 0.7, style: 0.8, use_speaker_boost: true };
  }
  if (tone === "formal") {
    return { stability: 0.6, similarity_boost: 0.7, style: 0.2, use_speaker_boost: true };
  }
  if (tone === "tired") {
    return { stability: 0.55, similarity_boost: 0.7, style: 0.1, use_speaker_boost: true };
  }
  return { stability: 0.45, similarity_boost: 0.7, style: 0.4, use_speaker_boost: true };
}

async function textToSpeech(text, tone = "neutral") {
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
      model_id: "eleven_flash_v2",
      voice_settings: voiceSettingsForTone(tone)
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
