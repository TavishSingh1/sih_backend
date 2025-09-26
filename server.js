// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000; // Render injects PORT

// --- CORS: allow ALL origins for GET/POST (and preflight) ---
app.use(cors({
  origin: "*",                          // allow any origin
  methods: ["GET", "POST", "OPTIONS"],  // allow GET, POST, and preflight
  allowedHeaders: ["Content-Type", "Accept"],
  credentials: false                    // must be false when origin is "*"
}));
app.options("*", cors());               // respond to all preflight requests

// --- Body parsing ---
app.use(express.json({ limit: "256kb" }));

// Canonical zones for your 9 cards
const ZONES = Array.from({ length: 9 }, (_, i) => `zone${i + 1}`);

// In-memory store: { [espZone]: { temperature, humidity, moisture, espZone, timestamp } }
const espData = Object.create(null);

// --- Health check ---
app.get("/", (_req, res) => {
  res.type("text/plain").send("OK");
});

// --- POST /data -> save latest reading for a zone ---
app.post("/data", (req, res) => {
  const { temperature, humidity, moisture, espZone } = req.body || {};

  if (!espZone) {
    return res.status(400).json({ error: "espZone is required" });
  }

  // Coerce to numbers if they arrive as strings
  const t = temperature !== undefined ? Number(temperature) : undefined;
  const h = humidity !== undefined ? Number(humidity) : undefined;
  const m = moisture !== undefined ? Number(moisture) : undefined;

  espData[espZone] = {
    temperature: t,
    humidity: h,
    moisture: m,
    espZone,
    timestamp: Date.now(),
  };

  console.log("Received from ESP:", espData[espZone]);
  return res.json({ message: "Data stored successfully", received: espData[espZone] });
});

// --- GET /data/:espZone -> fetch latest for that zone ---
app.get("/data/:espZone", (req, res) => {
  const zone = req.params.espZone;
  const data = espData[zone];

  if (!data) {
    return res.status(404).json({ error: "No data found for this espZone" });
  }
  return res.json(data);
});

// --- OPTIONAL: GET /data -> fetch all 9 zones (useful for debugging/UI) ---
app.get("/data", (_req, res) => {
  const payload = ZONES.map((z) => espData[z] || { error: "No data found for this espZone", espZone: z });
  res.json(payload);
});

// --- Start server ---
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
