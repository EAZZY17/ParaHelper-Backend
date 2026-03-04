function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function field(value) {
  return escapeHtml(value || "—");
}

function renderOccurrenceHtml(fields) {
  return `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #0f172a; }
        .header { background: #1f4f7a; color: #fff; padding: 16px; border-radius: 8px 8px 0 0; }
        .title { font-size: 18px; font-weight: 700; }
        .subtitle { font-size: 12px; opacity: 0.9; margin-top: 4px; }
        .container { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .section { padding: 14px 16px; border-top: 1px solid #e2e8f0; }
        .section-title { font-size: 12px; font-weight: 700; color: #2563eb; margin-bottom: 8px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; }
        .field label { font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: .05em; }
        .value { font-size: 12px; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; }
        .full { grid-column: 1 / -1; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">EMS Occurrence Report</div>
          <div class="subtitle">Emergency Medical Services — Incident Documentation</div>
        </div>
        <div class="section">
          <div class="section-title">Incident Overview</div>
          <div class="grid">
            <div class="field"><label>Date</label><div class="value">${field(fields.date)}</div></div>
            <div class="field"><label>Time</label><div class="value">${field(fields.time)}</div></div>
            <div class="field"><label>Call Number</label><div class="value">${field(fields.call_number)}</div></div>
            <div class="field"><label>Occurrence Type</label><div class="value">${field(fields.occurrence_type)}</div></div>
            <div class="field full"><label>Occurrence Reference</label><div class="value">${field(fields.occurrence_reference)}</div></div>
            <div class="field full"><label>Brief Description</label><div class="value">${field(fields.description)}</div></div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Service & Vehicle</div>
          <div class="grid">
            <div class="field"><label>Service</label><div class="value">${field(fields.service)}</div></div>
            <div class="field"><label>Vehicle</label><div class="value">${field(fields.vehicle_number)}</div></div>
            <div class="field full"><label>Vehicle Description</label><div class="value">${field(fields.vehicle_description)}</div></div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Personnel</div>
          <div class="grid">
            <div class="field"><label>Role</label><div class="value">${field(fields.role)}</div></div>
            <div class="field"><label>Badge</label><div class="value">${field(fields.badge_number)}</div></div>
            <div class="field full"><label>Paramedic Name</label><div class="value">${field(fields.paramedic_name)}</div></div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Report Details</div>
          <div class="grid">
            <div class="field full"><label>Observation / Description</label><div class="value">${field(fields.description)}</div></div>
            <div class="field full"><label>Action Taken</label><div class="value">${field(fields.immediate_actions)}</div></div>
            <div class="field full"><label>Suggested Resolution</label><div class="value">${field(fields.suggested_resolution)}</div></div>
            <div class="field full"><label>Management Notes</label><div class="value">${field(fields.management_notes)}</div></div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Submission Information</div>
          <div class="grid">
            <div class="field"><label>Requested By</label><div class="value">${field(fields.requested_by)}</div></div>
            <div class="field"><label>Report Creator</label><div class="value">${field(fields.report_creator)}</div></div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}

function renderTeddyHtml(fields) {
  return `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #0f172a; }
        .card { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .header { background: #1d4ed8; color: #fff; padding: 16px; text-align: center; }
        .title { font-size: 18px; font-weight: 700; }
        .subtitle { font-size: 12px; opacity: 0.9; margin-top: 4px; }
        .section { padding: 14px 16px; border-top: 1px solid #e2e8f0; }
        .section-title { font-size: 12px; font-weight: 700; color: #1d4ed8; margin-bottom: 8px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; }
        .field label { font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: .05em; }
        .value { font-size: 12px; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; }
        .full { grid-column: 1 / -1; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="title">Teddy Bear Comfort Program</div>
          <div class="subtitle">Emergency Medical Services — Patient Comfort Tracking</div>
        </div>
        <div class="section">
          <div class="section-title">Date & Time of Distribution</div>
          <div class="grid">
            <div class="field full"><label>Date / Time</label><div class="value">${field(fields.date_time)}</div></div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Primary Medic (Required)</div>
          <div class="grid">
            <div class="field"><label>First Name</label><div class="value">${field(fields.primary_medic_first)}</div></div>
            <div class="field"><label>Last Name</label><div class="value">${field(fields.primary_medic_last)}</div></div>
            <div class="field full"><label>Medic Number</label><div class="value">${field(fields.medic_number)}</div></div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Second Medic (Optional)</div>
          <div class="grid">
            <div class="field"><label>First Name</label><div class="value">${field(fields.second_medic_first)}</div></div>
            <div class="field"><label>Last Name</label><div class="value">${field(fields.second_medic_last)}</div></div>
            <div class="field full"><label>Medic Number</label><div class="value">${field(fields.second_medic_number)}</div></div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Teddy Bear Recipient</div>
          <div class="grid">
            <div class="field"><label>Age</label><div class="value">${field(fields.recipient_age)}</div></div>
            <div class="field"><label>Gender</label><div class="value">${field(fields.recipient_gender)}</div></div>
            <div class="field full"><label>Recipient Type</label><div class="value">${field(fields.recipient_type)}</div></div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}

function statusColor(status) {
  if (status === "BAD") return "#f59e0b";
  if (status === "GOOD") return "#22c55e";
  return "#94a3b8";
}

function renderStatusHtml({ title, items, meta }) {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td>${field(item.code)}</td>
        <td>${field(item.type || item.code)}</td>
        <td>${field(item.description)}</td>
        <td style="background:${statusColor(item.status)}; color:#0f172a; font-weight:700;">${field(
        item.status
      )}</td>
        <td>${field(item.count)}</td>
        <td>${field(item.notes || "")}</td>
      </tr>
    `
    )
    .join("");

  return `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #0f172a; }
        h2 { margin: 0 0 6px 0; }
        .subtitle { font-size: 12px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #111827; padding: 6px; vertical-align: top; }
        th { background: #f1f5f9; }
        .meta { font-size: 11px; margin: 6px 0 12px; }
      </style>
    </head>
    <body>
      <h2>${escapeHtml(title)}</h2>
      <div class="subtitle">EffectiveAI Paramedic Services</div>
      <div class="meta">Paramedic: ${field(meta.name)} | Badge: ${field(
    meta.badge
  )} | Role: ${field(meta.role)} | Station: ${field(meta.station)}</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Type</th>
            <th>Description</th>
            <th>Status</th>
            <th># of Issues</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:10px; font-size:10px;">Rev 20260225</div>
    </body>
  </html>
  `;
}

module.exports = { renderOccurrenceHtml, renderTeddyHtml, renderStatusHtml };
