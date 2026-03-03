const REQUIRED_FIELDS = {
  occurrence_report: ["occurrence_date", "occurrence_time", "location", "summary"],
  teddy_bear: ["child_name", "reason"],
  shift_report: ["shift_date"],
  status_report: ["request"]
};

function validateForm(formKey, fields) {
  const missing = [];
  const lowConfidence = [];
  const required = REQUIRED_FIELDS[formKey] || [];

  required.forEach((field) => {
    if (!fields[field]?.value) {
      missing.push(field);
    } else if (fields[field]?.confidence === "low") {
      lowConfidence.push(field);
    }
  });

  const ok = missing.length === 0 && lowConfidence.length === 0;
  return { ok, missing, lowConfidence };
}

function validateAll(extracted) {
  console.log("[guardrailAgent] validating");
  const results = {};
  Object.entries(extracted).forEach(([formKey, fields]) => {
    results[formKey] = validateForm(formKey, fields);
  });
  return results;
}

module.exports = { validateAll };
