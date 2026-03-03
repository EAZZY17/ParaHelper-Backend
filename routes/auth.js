const express = require("express");
const { getDb } = require("../utils/mongodb");
const { answerQuery } = require("../agents/knowledgeAgent");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { badge_number, pin } = req.body;
    const db = getDb("parahelper_users");
    const paramedic = await db.collection("paramedics").findOne({ badge_number, pin });

    if (!paramedic) {
      return res.status(401).json({ ok: false, message: "Invalid badge or PIN" });
    }

    const weather = await answerQuery({ text: "weather", paramedic });
    const schedule = await answerQuery({ text: "schedule", paramedic });
    const compliance = await answerQuery({ text: "compliance", paramedic });

    res.json({
      ok: true,
      paramedic,
      briefing: `Morning ${paramedic.first_name}! ${schedule} ${weather} ${compliance}`
    });
  } catch (error) {
    console.error("[auth] login failed", error);
    res.status(500).json({ ok: false, message: "Login failed" });
  }
});

module.exports = router;
