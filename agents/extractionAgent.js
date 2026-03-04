const { detectForms } = require("./formDetectiveAgent");

function makeField(value, confidence = "medium") {
  if (value === undefined || value === null || value === "") {
    return { value: "", confidence: "low" };
  }
  return { value, confidence };
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

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

function inferOccurrenceType(lower) {
  if (/(call|patient|scene)/.test(lower)) return "call_related";
  if (/(station|equipment|garage|bay|door|non-call)/.test(lower)) return "non_call_related";
  return "";
}

function parseRecipientGender(lower) {
  if (lower.includes("prefer not")) return "Prefer not to say";
  if (lower.includes("female")) return "Female";
  if (lower.includes("male")) return "Male";
  if (lower.includes("other")) return "Other";
  return "";
}

function parseRecipientType(lower) {
  if (lower.includes("patient")) return "Patient";
  if (lower.includes("family")) return "Family";
  if (lower.includes("bystander")) return "Bystander";
  if (lower.includes("other")) return "Other";
  return "";
}

function parseRecipientAge(text) {
  const ageMatch = text.match(/\b(\d{1,2})\s*(?:yo|y\/o|years?|yrs?)\b/i);
  if (ageMatch) return ageMatch[1];
  const aboutMatch = text.match(/\babout\s+(\d{1,2})\b/i);
  return aboutMatch?.[1] || "";
}

function parseCallNumber(text) {
  const callMatch = text.match(/\bcall\s*(?:#|number)?\s*([A-Za-z0-9-]+)\b/i);
  return callMatch?.[1] || "";
}

function extractOccurrence(text, paramedic) {
  const lower = text.toLowerCase();
  const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const locationMatch = text.match(/\b(?:at|near)\s+([^.,]+)/i);
  const occurrenceDate = dateMatch?.[1] || todayDate();
  const occurrenceTime = parseTime(text);

  return {
    date: makeField(occurrenceDate, "high"),
    time: makeField(occurrenceTime, occurrenceTime ? "medium" : "low"),
    call_number: makeField(parseCallNumber(text), "medium"),
    occurrence_type: makeField(inferOccurrenceType(lower), "medium"),
    occurrence_reference: makeField("", "low"),
    vehicle_number: makeField(
      paramedic?.unit_number || paramedic?.vehicle_number || paramedic?.unit_id || "",
      paramedic ? "high" : "low"
    ),
    vehicle_description: makeField(paramedic?.vehicle_description || "", paramedic ? "high" : "low"),
    service: makeField(paramedic?.service || paramedic?.service_name || "", paramedic ? "high" : "low"),
    role: makeField(paramedic?.role || "", paramedic ? "high" : "low"),
    badge_number: makeField(paramedic?.badge_number || "", paramedic ? "high" : "low"),
    paramedic_name: makeField(
      `${paramedic?.first_name || ""} ${paramedic?.last_name || ""}`.trim(),
      paramedic ? "high" : "low"
    ),
    description: makeField(text.slice(0, 400), "high"),
    immediate_actions: makeField("", "low"),
    requested_by: makeField("", "low"),
    report_creator: makeField(
      `${paramedic?.first_name || ""} ${paramedic?.last_name || ""}`.trim(),
      paramedic ? "high" : "low"
    ),
    location: makeField(locationMatch?.[1]?.trim() || "", "medium"),
    injuries_reported: makeField(
      lower.includes("no injuries") ? "No" : lower.includes("injur") ? "Yes" : "",
      lower.includes("injur") ? "medium" : "low"
    ),
    equipment_damage: makeField(
      /(equipment|defib|monitor|stretcher)/.test(lower) && /(damage|broke|broken|fail)/.test(lower)
        ? "Yes"
        : "",
      "medium"
    ),
    supervisor_notified: makeField(lower.includes("supervisor") ? "Yes" : "", "medium"),
    other_services_involved: makeField(
      ["police", "fire", "ems", "tow"].filter((svc) => lower.includes(svc)).join(", "),
      "medium"
    ),
    suggested_resolution: makeField("", "low"),
    management_notes: makeField("", "low")
  };
}

function extractTeddy(text, paramedic) {
  const lower = text.toLowerCase();
  return {
    date_time: makeField(new Date().toISOString(), "high"),
    primary_medic_first: makeField(paramedic?.first_name || "", paramedic ? "high" : "low"),
    primary_medic_last: makeField(paramedic?.last_name || "", paramedic ? "high" : "low"),
    medic_number: makeField(paramedic?.badge_number || "", paramedic ? "high" : "low"),
    recipient_age: makeField(parseRecipientAge(text), "medium"),
    recipient_gender: makeField(parseRecipientGender(lower), "medium"),
    recipient_type: makeField(parseRecipientType(lower), "medium"),
    second_medic_first: makeField("", "low"),
    second_medic_last: makeField("", "low"),
    second_medic_number: makeField("", "low")
  };
}

function extractShift(text) {
  return {
    query: makeField(text.slice(0, 200), "high")
  };
}

function extractStatus(text) {
  return {
    request: makeField(text.slice(0, 200), "high")
  };
}

function extractData(text, paramedic, providedForms = []) {
  console.log("[extractionAgent] extracting");
  const forms = providedForms.length ? providedForms : detectForms(text);
  const extracted = {};

  if (forms.includes("occurrence_report")) {
    extracted.occurrence_report = extractOccurrence(text, paramedic);
  }
  if (forms.includes("teddy_bear")) {
    extracted.teddy_bear = extractTeddy(text, paramedic);
  }
  if (forms.includes("shift_report")) {
    extracted.shift_report = extractShift(text);
  }
  if (forms.includes("status_report")) {
    extracted.status_report = extractStatus(text);
  }

  return { forms, extracted };
}

module.exports = { extractData };
