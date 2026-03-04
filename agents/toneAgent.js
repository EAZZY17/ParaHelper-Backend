function detectTone(text) {
  const lower = text.toLowerCase();

  const slang = /(yoo|yo|wsp|sup|bruh|lmao|ngl|fr|idk|rn|aye|lit|nah|u\s+good)/.test(lower);
  const formal = /(good morning|good afternoon|good evening|could you|please|thank you|kindly|would you)/.test(
    lower
  );
  const stressed = /(now|urgent|stat|asap|hurry|code|cpr|unconscious|cardiac|trauma)/.test(lower);
  const tired = /(tired|exhausted|long shift|just wanna go home|burnt out|drained)/.test(lower);
  const shortMessage = text.trim().length <= 12;

  if (stressed) return "stressed/short";
  if (tired) return "tired";
  if (slang) return "casual/slang";
  if (formal) return "formal";
  if (shortMessage) return "short";
  return "neutral";
}

module.exports = { detectTone };
