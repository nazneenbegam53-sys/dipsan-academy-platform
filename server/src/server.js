require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");
const { isConfigured: cloudinaryConfigured } = require("./config/cloudinary");
const { setupBoardSockets } = require("./realtime/boardSockets");

const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const questionRoutes = require("./routes/questionRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const resultRoutes = require("./routes/resultRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const noteRoutes = require("./routes/noteRoutes");
const classroomRoutes = require("./routes/classroomRoutes");
const boardRoutes = require("./routes/boardRoutes");

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nativeOrigins = [
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "https://localhost",
  "http://localhost:5173",
];

function corsOrigin(origin, callback) {
  // Allow non-browser / same-origin, configured clients, Vercel previews,
  // and Capacitor (iOS / Android) WebView origins.
  if (
    !origin ||
    allowedOrigins.includes(origin) ||
    nativeOrigins.includes(origin) ||
    /\.vercel\.app$/i.test(origin)
  ) {
    return callback(null, true);
  }
  return callback(null, allowedOrigins[0] || true);
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    // So cross-origin <video> players can read range / length headers.
    exposedHeaders: ["Accept-Ranges", "Content-Range", "Content-Length", "Content-Type"],
  })
);
app.use(express.json({ limit: "2mb" }));

// Legacy local-disk files (older uploads). New uploads go to Cloudinary or GridFS.
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    imageStorage: cloudinaryConfigured ? "cloudinary" : "gridfs",
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/exams", questionRoutes); // nested under /api/exams/:examId/questions
app.use("/api/attempts", attemptRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/notes", noteRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/boards", boardRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use(errorHandler);

setupBoardSockets(httpServer, corsOrigin);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  console.log(
    `Image storage: ${cloudinaryConfigured ? "Cloudinary" : "MongoDB GridFS (durable)"}`
  );
  httpServer.listen(PORT, () => console.log(`Dipsan Academy API running on port ${PORT}`));
});
