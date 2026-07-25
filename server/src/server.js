require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const questionRoutes = require("./routes/questionRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const resultRoutes = require("./routes/resultRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

// Serves images uploaded via the local-disk fallback path (no Cloudinary configured).
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/exams", questionRoutes); // nested under /api/exams/:examId/questions
app.use("/api/attempts", attemptRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/analytics", analyticsRoutes);

// TODO (not implemented): notifications (spec #24). A real implementation would
// hook into exam publish / result submission and send via an email provider
// (e.g. Resend, SendGrid) or SMS provider (e.g. Twilio). Stub below just logs.
function notify(event, payload) {
  console.log(`[notify:${event}]`, payload);
}
module.exports.notify = notify; // exported so controllers can `require("../server").notify(...)` later if wired in

app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Dipsan Academy API running on port ${PORT}`));
});
