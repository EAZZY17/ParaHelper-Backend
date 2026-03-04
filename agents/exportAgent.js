const fs = require("fs");
const path = require("path");
const { Builder } = require("xml2js");
const { Document, Packer, Paragraph } = require("docx");
const { sendEmail } = require("../utils/email");
const { getDb } = require("../utils/mongodb");
const { v4: uuid } = require("uuid");
const puppeteer = require("puppeteer");
const { renderOccurrenceHtml, renderTeddyHtml, renderStatusHtml } = require("../utils/pdfTemplates");

const EXPORT_DIR = path.join(__dirname, "..", "exports");

function ensureExportDir() {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

async function writePdfFromHtml(filename, html) {
  const filePath = path.join(EXPORT_DIR, filename);
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
  });
  await browser.close();
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

async function buildStatusReport(paramedic) {
  const usersDb = getDb("parahelper_users");
  const statusDoc = await usersDb
    .collection("paramedic_status")
    .findOne({ paramedic_id: paramedic.paramedic_id });

  if (statusDoc?.items?.length) {
    return statusDoc.items;
  }

  const toStatus = (value, badWhen = (v) => v > 0) => {
    if (value === undefined || value === null) {
      return { status: "UNKNOWN", count: "" };
    }
    if (typeof value === "boolean") {
      return { status: value ? "GOOD" : "BAD", count: value ? 0 : 1 };
    }
    const count = Number(value) || 0;
    return { status: badWhen(count) ? "BAD" : "GOOD", count };
  };

  const items = [
    { code: "ACRc", label: "ACR Completion", key: "acr_outstanding" },
    { code: "ACEr", label: "ACE Response", key: "ace_reviews_outstanding" },
    { code: "CERT-DL", label: "Drivers License", key: "drivers_license_valid", boolean: true },
    { code: "CERT-Va", label: "Vaccinations", key: "vaccination_overdue" },
    { code: "CERT-CE", label: "Education", key: "education_outstanding" },
    { code: "UNIF", label: "Uniform", key: "uniform_credits" },
    { code: "CRIM", label: "Criminal Record Check", key: "criminal_record_clear", boolean: true },
    { code: "ACP", label: "ACP Status", key: "acp_cert_valid", boolean: true },
    { code: "VAC", label: "Vacation", key: "vacation_approved", boolean: true },
    { code: "MEALS", label: "Missed Meals", key: "missed_meal_claims" },
    { code: "OVER", label: "Overtime", key: "overtime_outstanding" }
  ];

  return items.map((item) => {
    const rawValue = paramedic?.[item.key];
    const result = item.boolean ? toStatus(Boolean(rawValue)) : toStatus(rawValue);
    return {
      code: item.code,
      description: item.label,
      status: result.status,
      count: result.count
    };
  });
}

function statusItemsToFields(items) {
  const fields = {};
  items.forEach((item) => {
    fields[`${item.code}_status`] = item.status;
    fields[`${item.code}_count`] = item.count;
    fields[`${item.code}_description`] = item.description;
  });
  return fields;
}

function uniqueRecipients(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

async function exportForms({ paramedic, forms }) {
  console.log("[exportAgent] exporting");
  ensureExportDir();
  const db = getDb("parahelper_operations");
  const exportId = uuid();
  const attachments = [];
  const emailsSent = [];

  if (forms.occurrence_report) {
    await db.collection("occurrence_reports").insertOne({
      occurrence_id: `OCC-${exportId}`,
      paramedic_id: paramedic.paramedic_id,
      ...forms.occurrence_report,
      created_at: new Date()
    });
    const pdfPath = await writePdfFromHtml(
      `occurrence_${exportId}.pdf`,
      renderOccurrenceHtml(forms.occurrence_report)
    );
    attachments.push(pdfPath);
    const to = uniqueRecipients(["operations@ems.ca", paramedic.email]);
    await sendEmail({
      to,
      subject: "ParaHelper Occurrence Report",
      html: "Occurrence Report attached.",
      attachments: [pdfPath]
    });
    emailsSent.push({ form: "occurrence_report", to });
  }

  if (forms.teddy_bear) {
    await db.collection("teddy_bear_tracking").insertOne({
      tracking_id: `TBT-${exportId}`,
      paramedic_id: paramedic.paramedic_id,
      ...forms.teddy_bear,
      created_at: new Date()
    });
    const pdfPath = await writePdfFromHtml(
      `teddy_${exportId}.pdf`,
      renderTeddyHtml(forms.teddy_bear)
    );
    const xmlPath = writeXml(`teddy_${exportId}.xml`, forms.teddy_bear);
    attachments.push(pdfPath, xmlPath);
    const to = uniqueRecipients(["records@ems.ca", paramedic.email]);
    await sendEmail({
      to,
      subject: "ParaHelper Teddy Bear Tracking",
      html: "Teddy Bear Tracking form attached (PDF + XML).",
      attachments: [pdfPath, xmlPath]
    });
    emailsSent.push({ form: "teddy_bear", to });
  }

  if (forms.status_report) {
    const statusItems = await buildStatusReport(paramedic);
    const statusFields = {
      paramedic_name: `${paramedic.first_name} ${paramedic.last_name}`,
      badge_number: paramedic.badge_number || "",
      role: paramedic.role || "",
      station: paramedic.station || "",
      unit_number: paramedic.unit_number || paramedic.unit_id || "",
      generated_at: new Date().toISOString(),
      ...statusItemsToFields(statusItems)
    };
    const docxPath = await writeDocx(
      `status_${exportId}.docx`,
      "Paramedic Status Report",
      statusFields
    );
    const statusPdfPath = await writePdfFromHtml(
      `status_${exportId}.pdf`,
      renderStatusHtml({
        title: "Paramedic Checklist",
        items: statusItems,
        meta: {
          name: statusFields.paramedic_name,
          badge: statusFields.badge_number,
          role: statusFields.role,
          station: statusFields.station
        }
      })
    );
    attachments.push(docxPath, statusPdfPath);
    const supervisorEmail =
      paramedic.supervisor_email || paramedic.supervisorEmail || paramedic.supervisor?.email;
    const to = uniqueRecipients([paramedic.email, supervisorEmail]);
    await sendEmail({
      to,
      subject: "ParaHelper Paramedic Status Report",
      html: "Status report attached.",
      attachments: [docxPath, statusPdfPath]
    });
    emailsSent.push({ form: "status_report", to });
  }

  await db.collection("exports").insertOne({
    export_id: exportId,
    paramedic_id: paramedic.paramedic_id,
    created_at: new Date(),
    attachments,
    emailsSent
  });

  return { exportId, attachments, emailsSent };
}

module.exports = { exportForms };
