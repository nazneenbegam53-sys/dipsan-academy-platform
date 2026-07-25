const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadImage } = require("../controllers/uploadController");
const { protect, requireRole } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "..", "uploads")),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ok = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"].includes(file.mimetype);
  cb(ok ? null : new Error("Only PNG, JPEG, WEBP, GIF, or SVG images are allowed."), ok);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

// Only teachers upload question images.
router.post("/image", protect, requireRole("teacher"), upload.single("image"), uploadImage);

module.exports = router;
