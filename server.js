// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// --- CORS (allow dev + prod) ---
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow curl/postman
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    // fallback: allow all during bring-up (uncomment if needed)
    // return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Accept"],
  credentials: false,
}));
app.options("*", cors()); // preflight for ALL

app.use(express.json({ limit: "256kb" }));

const ZONES = Array.from({ length: 9 }, (_, i) => `zone${i + 1}`);
const espData = Object.create(null);

app.get("/", (_req, res) => res.type("text/plain").send("OK"));

app.post("/data", (req, res) => {
  const { temperature, humidity, moisture, espZone } = req.body || {};
  if (!espZone) return res.status(400).json({ error: "espZone is required" });

  const t = temperature !== undefined ? Number(temperature) : undefined;
  const h = humidity !== undefined ? Number(humidity) : undefined;
  const m = moisture !== undefined ? Number(moisture) : undefined;

  espData[espZone] = { temperature: t, humidity: h, moisture: m, espZone, timestamp: Date.now() };
  console.log("Received from ESP:", espData[espZone]);
  res.json({ message: "Data stored successfully", received: espData[espZone] });
});

app.get("/data/:espZone", (req, res) => {
  const zone = req.params.espZone;
  const data = espData[zone];
  if (!data) return res.status(404).json({ error: "No data found for this espZone" });
  res.json(data);
});

app.get("/data", (_req, res) => {
  const payload = ZONES.map((z) => espData[z] || { error: "No data found for this espZone", espZone: z });
  res.json(payload);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
