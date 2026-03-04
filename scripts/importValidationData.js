require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { MongoClient } = require("mongodb");

function loadCsv(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

function toDateTimeParts(dateTime) {
  if (!dateTime) return { date: "", time: "" };
  const [date, time] = dateTime.split(" ");
  return { date: date || "", time: time || "" };
}

function normalizeYesNo(value) {
  if (!value) return "";
  const lower = String(value).toLowerCase();
  if (lower === "yes" || lower === "true") return "Yes";
  if (lower === "no" || lower === "false") return "No";
  return value;
}

function statusItem(code, description, status, count) {
  return { code, description, status: status || "UNKNOWN", count: count ?? "" };
}

function buildStatusItems(row) {
  return [
    statusItem("ACRc", "ACR Completion", row.acr_completion, Number(row.acr_unfinished || 0)),
    statusItem("ACEr", "ACE Response", "UNKNOWN", ""),
    statusItem("CERT-DL", "Drivers License", row.driver_license, ""),
    statusItem("CERT-Va", "Vaccinations", row.vaccination, Number(row.vaccination_issues || 0)),
    statusItem("CERT-CE", "Education", row.education, Number(row.cme_outstanding || 0)),
    statusItem("UNIF", "Uniform", row.uniform_status, Number(row.uniform_credits || 0)),
    statusItem("CRIM", "Criminal Record Check", row.criminal_record, ""),
    statusItem("ACP", "ACP Status", row.acp_cert, ""),
    statusItem("VAC", "Vacation", row.vacation, ""),
    statusItem("MEALS", "Missed Meals", row.missed_meals, Number(row.missed_meals_count || 0)),
    statusItem("OVER", "Overtime", row.overtime, Number(row.overtime_count || 0))
  ];
}

async function run() {
  const inputDir = process.argv[2];
  const shouldReplace = process.argv.includes("--replace");
  if (!inputDir) {
    console.error("Usage: node scripts/importValidationData.js <data-directory>");
    process.exit(1);
  }

  const dataDir = path.resolve(inputDir);
  const files = {
    paramedics: path.join(dataDir, "paramedics.csv"),
    shifts: path.join(dataDir, "shifts.csv"),
    occurrenceReports: path.join(dataDir, "occurrence_reports.csv"),
    teddyBear: path.join(dataDir, "teddy_bear_tracking.csv"),
    statusReport: path.join(dataDir, "status_report.csv"),
    conversations: path.join(dataDir, "conversations.csv"),
    messages: path.join(dataDir, "messages.csv"),
    exports: path.join(dataDir, "exports.csv")
  };

  Object.entries(files).forEach(([key, filePath]) => {
    if (!fs.existsSync(filePath)) {
      console.error(`Missing file for ${key}: ${filePath}`);
      process.exit(1);
    }
  });

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing in environment");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const dbUsers = client.db("parahelper_users");
  const dbOps = client.db("parahelper_operations");
  const dbConvos = client.db("parahelper_conversations");

  if (shouldReplace) {
    await Promise.all([
      dbUsers.collection("paramedics").deleteMany({ source: "validation_run_v2_20260302" }),
      dbUsers.collection("paramedic_status").deleteMany({ source: "validation_run_v2_20260302" }),
      dbOps.collection("shifts").deleteMany({ source: "validation_run_v2_20260302" }),
      dbOps.collection("occurrence_reports").deleteMany({ source: "validation_run_v2_20260302" }),
      dbOps.collection("teddy_bear_tracking").deleteMany({ source: "validation_run_v2_20260302" }),
      dbOps.collection("exports").deleteMany({ source: "validation_run_v2_20260302" }),
      dbConvos.collection("conversations").deleteMany({ source: "validation_run_v2_20260302" }),
      dbConvos.collection("messages").deleteMany({ source: "validation_run_v2_20260302" })
    ]);
  }

  const paramedics = loadCsv(files.paramedics).map((row) => ({
    ...row,
    unit_number: row.unit,
    service: row.service || "EMS",
    supervisor_email: row.supervisor_email || "",
    vehicle_description: row.vehicle_description || "",
    source: "validation_run_v2_20260302"
  }));

  const shifts = loadCsv(files.shifts).map((row) => ({
    ...row,
    unit_number: row.unit_id,
    source: "validation_run_v2_20260302"
  }));

  const occurrenceReports = loadCsv(files.occurrenceReports).map((row) => {
    const { date, time } = toDateTimeParts(row.event_datetime);
    return {
      occurrence_id: row.occurrence_id,
      date,
      time,
      call_number: row.call_number || "",
      occurrence_type: row.occurrence_type,
      occurrence_reference: row.occurrence_reference || "",
      vehicle_number: row.unit_id,
      vehicle_description: row.vehicle_description || "",
      service: row.service || "EMS",
      role: row.role || "",
      badge_number: row.badge_number || "",
      paramedic_name: row.paramedic_name || "",
      description: row.description,
      immediate_actions: row.immediate_actions,
      requested_by: row.requested_by || "",
      report_creator: row.report_creator || "",
      location: row.location,
      injuries_reported: normalizeYesNo(row.injuries_reported),
      equipment_damage: normalizeYesNo(row.equipment_damage),
      supervisor_notified: normalizeYesNo(row.supervisor_notified),
      other_services_involved: row.other_services_involved || "",
      suggested_resolution: row.suggested_resolution || "",
      management_notes: row.management_notes || "",
      source: "validation_run_v2_20260302"
    };
  });

  const teddyBear = loadCsv(files.teddyBear).map((row) => ({
    tracking_id: row.tracking_id,
    date_time: row.event_datetime,
    primary_medic_first: row.primary_medic_first || "",
    primary_medic_last: row.primary_medic_last || "",
    medic_number: row.medic_number || "",
    recipient_age: row.recipient_age,
    recipient_gender: row.recipient_gender,
    recipient_type: row.recipient_type,
    second_medic_first: row.second_medic_first || "",
    second_medic_last: row.second_medic_last || "",
    second_medic_number: row.second_medic_number || "",
    location: row.location,
    source: "validation_run_v2_20260302"
  }));

  const statusReport = loadCsv(files.statusReport).map((row) => ({
    status_id: row.status_id,
    paramedic_id: row.paramedic_id,
    report_month: row.report_month,
    items: buildStatusItems(row),
    source: "validation_run_v2_20260302"
  }));

  const conversations = loadCsv(files.conversations).map((row) => ({
    ...row,
    source: "validation_run_v2_20260302"
  }));

  const messages = loadCsv(files.messages).map((row) => ({
    ...row,
    source: "validation_run_v2_20260302"
  }));

  const exportsData = loadCsv(files.exports).map((row) => ({
    ...row,
    source: "validation_run_v2_20260302"
  }));

  const insertIfAny = (collection, docs) =>
    docs.length ? collection.insertMany(docs) : Promise.resolve();

  await Promise.all([
    insertIfAny(dbUsers.collection("paramedics"), paramedics),
    insertIfAny(dbOps.collection("shifts"), shifts),
    insertIfAny(dbOps.collection("occurrence_reports"), occurrenceReports),
    insertIfAny(dbOps.collection("teddy_bear_tracking"), teddyBear),
    insertIfAny(dbUsers.collection("paramedic_status"), statusReport),
    insertIfAny(dbConvos.collection("conversations"), conversations),
    insertIfAny(dbConvos.collection("messages"), messages),
    insertIfAny(dbOps.collection("exports"), exportsData)
  ]);

  console.log("Import completed.");
  await client.close();
}

run().catch((error) => {
  console.error("Import failed", error);
  process.exit(1);
});
