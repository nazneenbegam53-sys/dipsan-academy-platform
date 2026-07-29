const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const { cloudinary, isConfigured } = require("../config/cloudinary");
const { uploadImage } = require("../controllers/uploadController");
const { protect, requireRole } = require("../middleware/auth");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "dipsan/questions",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
    public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  }),
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

const router = express.Router();

router.post(
  "/image",
  protect,
  requireRole("teacher"),
  (req, res, next) => {
    if (!isConfigured) {
      return res.status(500).json({
        message:
          "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      });
    }

    next();
  },
  upload.single("image"),
  uploadImage
);

module.exports = router;