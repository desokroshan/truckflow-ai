import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static(path.join(__dirname, "dist", "public")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "TruckFlow server running" });
});

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TruckFlow running on port ${PORT}`);
});
