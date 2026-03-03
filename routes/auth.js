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

    let briefing = `Morning ${paramedic.first_name}!`;
    try {
      const [weather, schedule, compliance] = await Promise.allSettled([
        answerQuery({ text: "weather", paramedic }),
        answerQuery({ text: "schedule", paramedic }),
        answerQuery({ text: "compliance", paramedic }),
      ]);
      const s = (r) => (r.status === "fulfilled" ? r.value : "");
      briefing = `Morning ${paramedic.first_name}! ${s(schedule)} ${s(weather)} ${s(compliance)}`.trim();
    } catch (err) {
      console.warn("[auth] briefing fetch failed, continuing login", err.message);
    }

    res.json({ ok: true, paramedic, briefing });
  } catch (error) {
    console.error("[auth] login failed", error);
    res.status(500).json({ ok: false, message: "Login failed" });
  }
});

module.exports = router;
