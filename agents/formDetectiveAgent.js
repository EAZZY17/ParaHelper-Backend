function detectForms(text) {
  const lower = text.toLowerCase();
  const forms = new Set();

  if (/(accident|incident|hit|damage)/.test(lower)) {
    forms.add("occurrence_report");
  }
  if (/(teddy|bear|comfort|scared kid)/.test(lower)) {
    forms.add("teddy_bear");
  }
  if (/(shift|schedule|when do i work)/.test(lower)) {
    forms.add("shift_report");
  }
  if (/(status|certification|vacation|compliance)/.test(lower)) {
    forms.add("status_report");
  }

  return Array.from(forms);
}

module.exports = { detectForms };
