const { ChromaClient } = require("chromadb");
const { getDb } = require("../utils/mongodb");
const { getNearbyHospitals } = require("../utils/mapbox");

const MUSKOKA_COORDS = { lat: 45.3319, lon: -79.2163 };

async function getWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${MUSKOKA_COORDS.lat}&longitude=${MUSKOKA_COORDS.lon}&current=temperature_2m,wind_speed_10m,weather_code`;
  const response = await fetch(url);
  const data = await response.json();
  const current = data.current || {};
  return `Weather now: ${current.temperature_2m ?? "?"}°C, wind ${current.wind_speed_10m ?? "?"} km/h.`;
}

async function hospitalRecommendation() {
  const nearby = await getNearbyHospitals({ proximity: MUSKOKA_COORDS });
  if (nearby.length) {
    return `Nearest hospitals: ${nearby
      .map((h) => `${h.name} (${h.distance_km ?? "?"} km)`)
      .join(", ")}.`;
  }
  return "Nearest hospitals: Huntsville District Memorial Hospital, South Muskoka Memorial Hospital (Bracebridge).";
}

async function getSchedule(paramedicId) {
  const db = getDb("parahelper_operations");
  const shift = await db.collection("shifts").findOne({ paramedic_id: paramedicId });
  if (!shift) {
    return "No upcoming shift found.";
  }
  return `Next shift: ${shift.shift_date || "unknown"} at ${shift.station || "station"} with ${shift.partner || "partner"}.`;
}

async function getCompliance(paramedicId) {
  const db = getDb("parahelper_users");
  const paramedic = await db.collection("paramedics").findOne({ paramedic_id: paramedicId });
  if (!paramedic) {
    return "Compliance data not found.";
  }
  const overdue = paramedic.vaccination_overdue ? "Vaccination overdue." : "Vaccinations up to date.";
  return `${overdue}`;
}

async function queryChroma(text, role) {
  const chromaUrl = (process.env.CHROMA_URL || "").trim();
  if (!chromaUrl) {
    return "";
  }
  try {
    const client = new ChromaClient({ path: chromaUrl });
    const collection = await client.getCollection({ name: "parahelper_medical" });
    const result = await collection.query({
      queryTexts: [text],
      nResults: 3,
      where: { $or: [{ role }, { role: "all" }] }
    });

    const documents = result.documents?.[0] || [];
    return documents.join("\n");
  } catch (error) {
    console.warn("[knowledge] Chroma query failed", error.message);
    return "";
  }
}

async function answerQuery({ text, paramedic }) {
  try {
    const lower = text.toLowerCase();

    if (lower.includes("weather")) {
      return await getWeather();
    }
    if (lower.includes("hospital")) {
      return await hospitalRecommendation();
    }
    if (lower.includes("schedule") || lower.includes("shift")) {
      return await getSchedule(paramedic.paramedic_id);
    }
    if (lower.includes("compliance") || lower.includes("certification")) {
      return await getCompliance(paramedic.paramedic_id);
    }

    const knowledge = await queryChroma(text, paramedic.role || "all");
    return knowledge || "No medical reference found.";
  } catch (error) {
    console.warn("[knowledge] answerQuery failed", error.message);
    return "";
  }
}

module.exports = { answerQuery };
