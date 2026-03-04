const express = require("express");
const { getDb } = require("../utils/mongodb");
const { validateAll } = require("../agents/guardrailAgent");
const { exportForms } = require("../agents/exportAgent");

const router = express.Router();

function flattenFields(form) {
  const output = {};
  Object.entries(form).forEach(([key, value]) => {
    output[key] = value?.value ?? value;
  });
  return output;
}

router.post("/validate", (req, res) => {
  const { extracted } = req.body;
  const guardrails = validateAll(extracted || {});
  res.json({ ok: true, guardrails });
});

router.post("/send", async (req, res) => {
  try {
    const { paramedic_id, extracted } = req.body;
    const usersDb = getDb("parahelper_users");
    const paramedic = await usersDb.collection("paramedics").findOne({ paramedic_id });
    if (!paramedic) {
      return res.status(404).json({ ok: false, message: "Paramedic not found" });
    }

    const guardrails = validateAll(extracted || {});
    const blocked = Object.values(guardrails).some((result) => !result.ok);
    if (blocked) {
      return res.status(400).json({ ok: false, message: "Guardrails blocked send", guardrails });
    }

    const forms = {};
    Object.entries(extracted || {}).forEach(([key, value]) => {
      forms[key] = flattenFields(value);
    });

    const exportResult = await exportForms({ paramedic, forms });
    res.json({ ok: true, export: exportResult });
  } catch (error) {
    console.error("[forms] send failed", error);
    res.status(500).json({ ok: false, message: "Send failed" });
  }
});

// Shift-start ambulance vehicle inventory (car check)
router.post("/vehicle-check", async (req, res) => {
  try {
    const {
      paramedic_id,
      paramedic_name,
      unit_number,
      shift_date,
      shift_time,
      station_location,
      checks,
      notes,
      report_type
    } = req.body;

    if (!paramedic_id || !unit_number || !shift_date) {
      return res
        .status(400)
        .json({ ok: false, message: "paramedic_id, unit_number and shift_date are required" });
    }

    const formsDb = getDb("parahelper_forms");
    const collection = formsDb.collection("vehicle_checks");

    const doc = {
      paramedic_id,
      paramedic_name,
      unit_number,
      shift_date,
      shift_time,
      station_location,
      checks: checks || {},
      notes: notes || "",
      report_type: report_type || "standard",
      created_at: new Date()
    };

    await collection.insertOne(doc);
    res.json({ ok: true });
  } catch (error) {
    console.error("[forms] vehicle-check failed", error);
    res.status(500).json({ ok: false, message: "Vehicle check save failed" });
  }
});

// Ambulance equipment inventory form
router.post("/equipment-inventory", async (req, res) => {
  try {
    const {
      paramedic_id,
      paramedic_name,
      unit_number,
      shift_date,
      items,
      expiry_items,
      notes,
      report_type
    } = req.body;

    if (!paramedic_id || !unit_number || !shift_date) {
      return res
        .status(400)
        .json({ ok: false, message: "paramedic_id, unit_number and shift_date are required" });
    }

    const formsDb = getDb("parahelper_forms");
    const collection = formsDb.collection("equipment_inventory");

    const doc = {
      paramedic_id,
      paramedic_name,
      unit_number,
      shift_date,
      items: items || [],
      expiry_items: expiry_items || [],
      notes: notes || "",
      report_type: report_type || "inventory",
      created_at: new Date()
    };

    await collection.insertOne(doc);
    res.json({ ok: true });
  } catch (error) {
    console.error("[forms] equipment-inventory failed", error);
    res.status(500).json({ ok: false, message: "Equipment inventory save failed" });
  }
});

module.exports = router;
