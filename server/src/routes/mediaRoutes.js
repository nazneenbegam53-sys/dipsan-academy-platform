const express = require("express");
const mongoose = require("mongoose");
const { asyncHandler } = require("../middleware/errorHandler");
const { streamGridFSFile, VIDEO_BUCKET, IMAGE_BUCKET } = require("../utils/mediaStorage");

const router = express.Router();

function getBucket(bucketName) {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName });
}

async function findMediaFile(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const _id = new mongoose.Types.ObjectId(id);
  for (const bucketName of [VIDEO_BUCKET, IMAGE_BUCKET]) {
    const files = await getBucket(bucketName).find({ _id }).toArray();
    if (files.length) return { file: files[0], bucketName };
  }
  return null;
}

// Public read — exam images / video solutions must be fetchable by the browser.
// Browsers send Range requests for <video>; streamGridFSFile handles 206 responses.
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    req.on("aborted", () => {
      /* no-op */
    });

    try {
      const found = await streamGridFSFile(req.params.id, req, res);
      if (!found) {
        return res.status(404).json({ message: "Media not found." });
      }
    } catch (err) {
      if (res.headersSent || req.aborted) return;
      throw err;
    }
  })
);

// Probe size / type without downloading the body (helps some players).
router.head(
  "/:id",
  asyncHandler(async (req, res) => {
    const hit = await findMediaFile(req.params.id);
    if (!hit) return res.status(404).end();

    const { file, bucketName } = hit;
    const path = require("path");
    const mime = (file.contentType || "").split(";")[0].trim().toLowerCase();
    const ext = path.extname(file.filename || "").toLowerCase();
    const byExt = {
      ".webm": "video/webm",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };
    const contentType =
      mime && mime !== "application/octet-stream"
        ? mime
        : byExt[ext] || (bucketName === VIDEO_BUCKET ? "video/webm" : "application/octet-stream");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Length", file.length || 0);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.status(200).end();
  })
);

module.exports = router;
