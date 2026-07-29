const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("../config/cloudinary");
const { uploadImage } = require("../controllers/uploadController");
const { protect, requireRole } = require("../middleware/auth");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "dipsan/questions",
    resource_type: "image",
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
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