const express = require("express");
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Store latest data by espZone
let espData = {};  

// POST /data → save incoming ESP data
app.post("/data", (req, res) => {
    const { temperature, humidity, moisture, espZone } = req.body;

    if (espZone === undefined) {
        return res.status(400).json({ error: "espZone is required" });
    }

    espData[espZone] = { temperature, humidity, moisture, espZone, timestamp: Date.now() };

    console.log("Received from ESP:", espData[espZone]);

    res.json({ message: "Data stored successfully", received: espData[espZone] });
});

// GET /data/:espZone → fetch data for a specific ESP zone
app.get("/data/:espZone", (req, res) => {
    const zone = req.params.espZone;

    if (!espData[zone]) {
        return res.status(404).json({ error: "No data found for this espZone" });
    }

    res.json(espData[zone]);
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
