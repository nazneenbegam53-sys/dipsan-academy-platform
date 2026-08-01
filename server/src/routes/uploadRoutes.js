const express = require("express");
const multer = require("multer");
const { uploadImage } = require("../controllers/uploadController");
const { protect, requireRole } = require("../middleware/auth");

// Memory storage — bytes go to Cloudinary or MongoDB GridFS, never ephemeral disk.
const upload = multer({
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

const router = express.Router();

router.post(
  "/image",
  protect,
  requireRole("teacher"),
  upload.single("image"),
  uploadImage
);

module.exports = router;
