const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  streamGridFSFile,
  ensureMp4Id,
  VIDEO_BUCKET,
  IMAGE_BUCKET,
} = require("../utils/mediaStorage");

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

function setCors(res) {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Accept-Ranges, Content-Range, Content-Length, Content-Type"
  );
}

async function respondHead(res, id) {
  const hit = await findMediaFile(id);
  if (!hit) return res.status(404).end();

  const { file, bucketName } = hit;
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

  setCors(res);
  res.setHeader("Content-Type", contentType);
  res.setHeader("Accept-Ranges", contentType.includes("webm") ? "none" : "bytes");
  res.setHeader("Content-Length", file.length || 0);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).end();
}

// Public read — exam images / video solutions must be fetchable by the browser.
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    req.on("aborted", () => {
      /* no-op */
    });

    try {
      // Only convert on the dedicated /mp4 route — avoids surprise OOM on every mobile GET.
      const preferMp4 = false;
      const found = await streamGridFSFile(req.params.id, req, res, { preferMp4 });
      if (!found) {
        return res.status(404).json({ message: "Media not found." });
      }
    } catch (err) {
      if (res.headersSent || req.aborted) return;
      throw err;
    }
  })
);

// Explicit mobile-safe MP4 derivative (cached after first conversion).
router.get(
  "/:id/mp4",
  asyncHandler(async (req, res) => {
    req.on("aborted", () => {
      /* no-op */
    });
    try {
      const mp4Id = await ensureMp4Id(req.params.id);
      if (!mp4Id) return res.status(404).json({ message: "Media not found." });
      const found = await streamGridFSFile(mp4Id, req, res, { preferMp4: false });
      if (!found) return res.status(404).json({ message: "Media not found." });
    } catch (err) {
      if (res.headersSent || req.aborted) return;
      const message = err?.message || "Could not convert video for mobile playback.";
      return res.status(503).json({ message });
    }
  })
);

// Probe only — never trigger ffmpeg here (HEAD was causing RAM spikes).
router.head(
  "/:id",
  asyncHandler(async (req, res) => {
    await respondHead(res, req.params.id);
  })
);

router.head(
  "/:id/mp4",
  asyncHandler(async (req, res) => {
    // If a cached derivative exists, describe it; otherwise describe the source
    // without converting (conversion happens on GET /:id/mp4).
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).end();
    const bucket = getBucket(VIDEO_BUCKET);
    const cached = await bucket
      .find({
        "metadata.sourceId": String(req.params.id),
        "metadata.derivative": "mp4",
      })
      .toArray();
    if (cached[0]) {
      return respondHead(res, cached[0]._id.toString());
    }
    setCors(res);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).end();
  })
);

module.exports = router;
