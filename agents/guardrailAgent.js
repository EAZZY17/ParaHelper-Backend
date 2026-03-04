const REQUIRED_FIELDS = {
  occurrence_report: [
    "date",
    "time",
    "call_number",
    "occurrence_type",
    "occurrence_reference",
    "vehicle_number",
    "service",
    "role",
    "badge_number",
    "paramedic_name",
    "description",
    "immediate_actions",
    "requested_by",
    "report_creator"
  ],
  teddy_bear: [
    "date_time",
    "primary_medic_first",
    "primary_medic_last",
    "medic_number",
    "recipient_age",
    "recipient_gender",
    "recipient_type"
  ],
  shift_report: [],
  status_report: []
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
