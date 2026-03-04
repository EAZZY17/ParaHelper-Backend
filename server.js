require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const formsRoutes = require("./routes/forms");
const { connectMongo } = require("./utils/mongodb");

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/exports", express.static(path.join(__dirname, "exports")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "parahelper-backend" });
});

app.get("/api/debug/openrouter", async (req, res) => {
  const rawKey = process.env.OPENROUTER_API_KEY;
  const apiKey = typeof rawKey === "string" ? rawKey.trim() : "";
  if (!apiKey) {
    return res.json({ ok: false, error: "OPENROUTER_API_KEY not set or empty" });
  }
  try {
    const { chatCompletion } = require("./utils/openrouter");
    await chatCompletion({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: "Reply with exactly: OK" }]
    });
    res.json({ ok: true });
  } catch (e) {
    const body = e.response?.data;
    res.json({
      ok: false,
      error: body?.error?.message || e.message,
      code: body?.error?.code,
      full: body
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/forms", formsRoutes);

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] ParaHelper backend running on ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("[server] Failed to start", error);
    process.exit(1);
  });
