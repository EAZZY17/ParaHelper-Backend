async function sendEmail({ to, subject, html, attachments = [] }) {
  console.log("[email] sendEmail", { to, subject, attachmentsCount: attachments.length });
  if (process.env.SENDGRID_API_KEY) {
    console.log("[email] SENDGRID_API_KEY detected but integration not wired yet");
  }
  return { ok: true, queued: true };
}

module.exports = { sendEmail };
