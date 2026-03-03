const { detectForms } = require("./formDetectiveAgent");

function confidence(value) {
  if (!value) return "low";
  if (typeof value === "string" && value.length > 3) return "high";
  return "medium";
}

function extractOccurrence(text) {
  const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const timeMatch = text.match(/\b(\d{1,2}:\d{2})\b/);
  const locationMatch = text.match(/at ([^.,]+)/i);
  const patientMatch = text.match(/patient\s+([A-Za-z]+)?\s?(\d{1,2})/i);
  return {
    occurrence_date: dateMatch?.[1] || "",
    occurrence_time: timeMatch?.[1] || "",
    location: locationMatch?.[1]?.trim() || "",
    patient_age: patientMatch?.[2] || "",
    summary: text.slice(0, 200)
  };
}

function extractTeddy(text) {
  const childMatch = text.match(/child\s+([A-Za-z]+)/i);
  return {
    child_name: childMatch?.[1] || "",
    reason: text.slice(0, 160)
  };
}

function extractShift(text) {
  const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  return {
    shift_date: dateMatch?.[1] || "",
    note: text.slice(0, 140)
  };
}

function extractStatus(text) {
  return {
    request: text.slice(0, 140)
  };
}

function attachConfidence(fields) {
  const result = {};
  Object.entries(fields).forEach(([key, value]) => {
    result[key] = { value, confidence: confidence(value) };
  });
  return result;
}

function extractData(text, providedForms = []) {
  console.log("[extractionAgent] extracting");
  const forms = providedForms.length ? providedForms : detectForms(text);
  const extracted = {};

  if (forms.includes("occurrence_report")) {
    extracted.occurrence_report = attachConfidence(extractOccurrence(text));
  }
  if (forms.includes("teddy_bear")) {
    extracted.teddy_bear = attachConfidence(extractTeddy(text));
  }
  if (forms.includes("shift_report")) {
    extracted.shift_report = attachConfidence(extractShift(text));
  }
  if (forms.includes("status_report")) {
    extracted.status_report = attachConfidence(extractStatus(text));
  }

  return { forms, extracted };
}

module.exports = { extractData };
