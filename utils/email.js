const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

function normalizeRecipients(to) {
  if (!to) return "";
  if (Array.isArray(to)) return to.filter(Boolean).join(", ");
  return String(to);
}

function toMailAttachments(attachments) {
  return (attachments || []).map((filePath) => ({
    filename: path.basename(filePath),
    content: fs.readFileSync(filePath)
  }));
}

function getTransporter() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 587,
    auth: {
      user: "resend",
      pass: apiKey
    }
  });
}

async function sendEmail({ to, subject, html, attachments = [] }) {
  const recipients = normalizeRecipients(to);
  console.log("[email] sendEmail", { to: recipients, subject, attachmentsCount: attachments.length });
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[email] RESEND_API_KEY missing; skipping real send");
    return { ok: false, queued: false, reason: "RESEND_API_KEY missing" };
  }

  const from = process.env.RESEND_FROM || "noreply@parahelper.app";
  const info = await transporter.sendMail({
    from,
    to: recipients,
    subject,
    html,
    attachments: toMailAttachments(attachments)
  });
  return { ok: true, messageId: info.messageId };
}

module.exports = { sendEmail };
