const REPLACEMENTS = [
  ["epi", "epinephrine"],
  ["naloxon", "naloxone"],
  ["nitro", "nitroglycerin"],
  ["stemi", "STEMI"],
  ["air way", "airway"],
  ["bag valve", "BVM"]
];

function cleanTranscription(text) {
  console.log("[transcriptionCleaner] cleaning");
  let cleaned = text;
  REPLACEMENTS.forEach(([from, to]) => {
    const regex = new RegExp(`\\b${from}\\b`, "gi");
    cleaned = cleaned.replace(regex, to);
  });
  return cleaned;
}

module.exports = { cleanTranscription };
