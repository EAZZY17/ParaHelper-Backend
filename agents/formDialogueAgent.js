function parseTime(text) {
  const time24 = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (time24) {
    return `${time24[1].padStart(2, "0")}:${time24[2]}`;
  }
  const time12 = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!time12) return "";
  let hour = Number(time12[1]);
  const minutes = time12[2] ? time12[2] : "00";
  const meridiem = time12[3].toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minutes}`;
}

function parseYesNo(text) {
  const lower = text.toLowerCase();
  if (/\b(yes|yep|yeah|affirmative|correct)\b/.test(lower)) return "Yes";
  if (/\b(no|nope|negative)\b/.test(lower)) return "No";
  return "";
}

function parseRecipientGender(text) {
  const lower = text.toLowerCase();
  if (lower.includes("prefer not")) return "Prefer not to say";
  if (lower.includes("female")) return "Female";
  if (lower.includes("male")) return "Male";
  if (lower.includes("other")) return "Other";
  return "";
}

function parseRecipientType(text) {
  const lower = text.toLowerCase();
  if (lower.includes("patient")) return "Patient";
  if (lower.includes("family")) return "Family";
  if (lower.includes("bystander")) return "Bystander";
  if (lower.includes("other")) return "Other";
  return "";
}

function parseCallNumber(text) {
  const callMatch = text.match(/\bcall\s*(?:#|number)?\s*([A-Za-z0-9-]+)\b/i);
  return callMatch?.[1] || "";
}

function isAffirmative(text) {
  return /\b(yes|yep|yeah|ok|okay|confirm|send|go ahead|please do)\b/i.test(text);
}

function isNegative(text) {
  return /\b(no|nope|not yet|wait|hold|cancel)\b/i.test(text);
}

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
  ]
};

const FIELD_QUESTIONS = {
  occurrence_report: {
    time: "Got it — roughly what time did it happen?",
    call_number: "What’s the call number?",
    occurrence_type: "Was this call‑related or non‑call‑related?",
    occurrence_reference: "Do you have an occurrence reference number handy?",
    description: "In a sentence or two, what happened?",
    immediate_actions: "What did you do right after it happened?",
    requested_by: "Who asked for the report?"
  },
  teddy_bear: {
    recipient_age: "How old was the recipient?",
    recipient_gender: "What gender should I record (Male, Female, Other, Prefer not to say)?",
    recipient_type: "Recipient type — Patient, Family, Bystander, or Other?"
  }
};

function applyAnswerToField(formKey, field, text) {
  let value = text.trim();
  let confidence = value ? "medium" : "low";

  if (field === "time") {
    const parsed = parseTime(text);
    if (parsed) {
      value = parsed;
      confidence = "high";
    }
  }

  if (field === "occurrence_type") {
    const lower = text.toLowerCase();
    if (lower.includes("call")) {
      value = "call_related";
      confidence = "high";
    } else if (lower.includes("non")) {
      value = "non_call_related";
      confidence = "high";
    }
  }

  if (field === "call_number") {
    const parsed = parseCallNumber(text);
    if (parsed) {
      value = parsed;
      confidence = "high";
    }
  }

  if (["injuries_reported", "equipment_damage", "supervisor_notified"].includes(field)) {
    const parsed = parseYesNo(text);
    if (parsed) {
      value = parsed;
      confidence = "high";
    }
  }

  if (field === "recipient_gender") {
    const parsed = parseRecipientGender(text);
    if (parsed) {
      value = parsed;
      confidence = "high";
    }
  }

  if (field === "recipient_type") {
    const parsed = parseRecipientType(text);
    if (parsed) {
      value = parsed;
      confidence = "high";
    }
  }

  return { value, confidence };
}

function getNextMissingField(guardrailResult, formKey) {
  const missing = guardrailResult?.[formKey]?.missing || [];
  return missing[0] || "";
}

function getQuestion(formKey, field) {
  return FIELD_QUESTIONS?.[formKey]?.[field] || `Please provide ${field.replace(/_/g, " ")}.`;
}

function buildConfirmationMessage(formKeys) {
  if (formKeys.length === 1) {
    const label = formKeys[0] === "occurrence_report" ? "Occurrence Report" : "Teddy Bear Form";
    return `I have everything for the ${label}. Send it now?`;
  }
  return "I have everything for both forms. Send them now?";
}

module.exports = {
  REQUIRED_FIELDS,
  isAffirmative,
  isNegative,
  applyAnswerToField,
  getNextMissingField,
  getQuestion,
  buildConfirmationMessage
};
