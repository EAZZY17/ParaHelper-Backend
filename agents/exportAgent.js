const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");
const { Builder } = require("xml2js");
const { Document, Packer, Paragraph } = require("docx");
const { sendEmail } = require("../utils/email");
const { getDb } = require("../utils/mongodb");
const { v4: uuid } = require("uuid");

const EXPORT_DIR = path.join(__dirname, "..", "exports");

function ensureExportDir() {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

function writePdf(filename, title, fields) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 10, 15);
  doc.setFontSize(12);
  let y = 30;
  Object.entries(fields).forEach(([key, value]) => {
    doc.text(`${key}: ${value}`, 10, y);
    y += 8;
  });
  const filePath = path.join(EXPORT_DIR, filename);
  doc.save(filePath);
  return filePath;
}

function writeXml(filename, fields) {
  const builder = new Builder({ rootName: "teddy_bear_tracking" });
  const xml = builder.buildObject(fields);
  const filePath = path.join(EXPORT_DIR, filename);
  fs.writeFileSync(filePath, xml, "utf-8");
  return filePath;
}

async function writeDocx(filename, title, fields) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: title, heading: "Heading1" }),
          ...Object.entries(fields).map(([key, value]) => new Paragraph(`${key}: ${value}`))
        ]
      }
    ]
  });
  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(EXPORT_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function exportForms({ paramedic, forms }) {
  console.log("[exportAgent] exporting");
  ensureExportDir();
  const db = getDb("parahelper_operations");
  const exportId = uuid();
  const attachments = [];

  if (forms.occurrence_report) {
    const pdfPath = writePdf(
      `occurrence_${exportId}.pdf`,
      "Occurrence Report",
      forms.occurrence_report
    );
    attachments.push(pdfPath);
  }

  if (forms.teddy_bear) {
    const pdfPath = writePdf(
      `teddy_${exportId}.pdf`,
      "Teddy Bear Tracking",
      forms.teddy_bear
    );
    const xmlPath = writeXml(`teddy_${exportId}.xml`, forms.teddy_bear);
    attachments.push(pdfPath, xmlPath);
  }

  if (forms.status_report) {
    const docxPath = await writeDocx(
      `status_${exportId}.docx`,
      "Paramedic Status Report",
      forms.status_report
    );
    attachments.push(docxPath);
  }

  await db.collection("exports").insertOne({
    export_id: exportId,
    paramedic_id: paramedic.paramedic_id,
    created_at: new Date(),
    attachments
  });

  await sendEmail({
    to: paramedic.email,
    subject: "ParaHelper Exported Forms",
    html: "Attached are your requested forms.",
    attachments
  });

  return { exportId, attachments };
}

module.exports = { exportForms };
