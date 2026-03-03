const { sendEmail } = require("../utils/email");
const { getDb } = require("../utils/mongodb");

function detectAdminTask(text) {
  const lower = text.toLowerCase();
  if (lower.includes("uniform")) return "uniform";
  if (lower.includes("vacation")) return "vacation";
  if (lower.includes("overtime")) return "overtime";
  if (lower.includes("meal")) return "missed_meal";
  return null;
}

async function handleAdminTask({ text, paramedic }) {
  const task = detectAdminTask(text);
  if (!task) return null;

  console.log(`[adminAgent] handling ${task}`);
  const db = getDb("parahelper_operations");
  await db.collection("admin_requests").insertOne({
    paramedic_id: paramedic.paramedic_id,
    task,
    text,
    created_at: new Date()
  });

  await sendEmail({
    to: "supervisor@parahelper.app",
    subject: `ParaHelper ${task} request`,
    html: `<p>${paramedic.first_name} ${paramedic.last_name} requested: ${text}</p>`
  });

  return `Got it. I logged your ${task.replace("_", " ")} request and sent it to your supervisor.`;
}

module.exports = { detectAdminTask, handleAdminTask };
