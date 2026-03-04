function detectForms(text) {
  const lower = text.toLowerCase();
  const forms = new Set();

  if (/(ems\s*occurrence|occurrence\s*report|file\s*(an?)?\s*occurrence|want\s+to\s+do\s+(an?\s+)?occurrence|need\s+to\s+file\s+(an?\s+)?(ems\s+)?occurrence|accident|incident|hit|damage|collision|broke|fell|spill|backed into|clipped|occurrence|station door|equipment)/.test(lower) || /\breport\b.*\b(occurrence|ems|incident)\b/i.test(lower)) {
    forms.add("occurrence_report");
  }
  if (/(teddy|bear|teddy bear|comfort|gave a bear|scared kid|scared child|comfort item|stuffed animal)/.test(lower)) {
    forms.add("teddy_bear");
  }
  if (/(shift|schedule|when do i work|my hours|next shift|days off|who is my partner|what unit|am i working|when am i off)/.test(lower)) {
    forms.add("shift_report");
  }
  if (/(status|compliance|certification|certifications|am i good|vaccination|license|driver license|uniform|vacation|overtime|missed meals|acr|criminal|up to date|my record)/.test(lower)) {
    forms.add("status_report");
  }

  return Array.from(forms);
}

module.exports = { detectForms };
