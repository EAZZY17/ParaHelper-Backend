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

module.exports = router;
