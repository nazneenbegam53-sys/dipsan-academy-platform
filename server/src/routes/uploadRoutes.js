const express = require("express");
const multer = require("multer");
const { uploadImage, uploadVideo, uploadPdf } = require("../controllers/uploadController");
const { protect, requireRole } = require("../middleware/auth");

// Memory storage — bytes go to Cloudinary or MongoDB GridFS, never ephemeral disk.
const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ];
    const ok = allowed.includes(file.mimetype);
    cb(ok ? null : new Error("Invalid image type. Use PNG, JPEG, WebP, GIF, or SVG."), ok);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || "").toLowerCase().split(";")[0].trim();
    const name = (file.originalname || "").toLowerCase();
    const extOk = /\.(webm|mp4|mov|mkv|m4v)$/i.test(name);
    const mimeOk =
      !mime ||
      mime === "application/octet-stream" ||
      mime.startsWith("video/") ||
      ["video/webm", "video/mp4", "video/quicktime", "video/x-matroska"].includes(mime);
    const ok = mimeOk || extOk;
    cb(ok ? null : new Error("Invalid video type. Use WebM or MP4."), ok);
  },
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB — question-wise explanations
  },
});

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || "").toLowerCase().split(";")[0].trim();
    const name = (file.originalname || "").toLowerCase();
    const ok = mime === "application/pdf" || name.endsWith(".pdf") || mime === "application/octet-stream";
    cb(ok ? null : new Error("Upload a PDF file."), ok);
  },
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
});

const router = express.Router();

router.post(
  "/image",
  protect,
  requireRole("teacher"),
  imageUpload.single("image"),
  uploadImage
);

router.post(
  "/video",
  protect,
  requireRole("teacher"),
  videoUpload.single("video"),
  uploadVideo
);

router.post(
  "/pdf",
  protect,
  requireRole("teacher"),
  pdfUpload.single("pdf"),
  uploadPdf
);

module.exports = router;
