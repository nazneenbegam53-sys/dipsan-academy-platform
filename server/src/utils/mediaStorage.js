const mongoose = require("mongoose");
const { Readable } = require("stream");
const path = require("path");
const { cloudinary, isConfigured: cloudinaryConfigured } = require("../config/cloudinary");

const IMAGE_BUCKET = "questionImages";
const VIDEO_BUCKET = "questionVideos";

function getBucket(bucketName = IMAGE_BUCKET) {
  if (!mongoose.connection?.db) {
    throw new Error("MongoDB is not connected yet.");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName,
  });
}

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function guessContentType(filename, mimetype, bucketName) {
  const mime = (mimetype || "").split(";")[0].trim().toLowerCase();
  if (mime && mime !== "application/octet-stream") return mime;

  const ext = path.extname(filename || "").toLowerCase();
  const byExt = {
    ".webm": "video/webm",
    ".mp4": "video/mp4",
    ".m4v": "video/mp4",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  if (byExt[ext]) return byExt[ext];
  return bucketName === VIDEO_BUCKET ? "video/webm" : "application/octet-stream";
}

async function uploadToCloudinary(file, { resourceType = "image", folder = "dipsan/questions" } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          provider: "cloudinary",
          publicId: result.public_id,
          duration: result.duration ?? null,
        });
      }
    );
    bufferToStream(file.buffer).pipe(stream);
  });
}

async function uploadToGridFS(file, bucketName = IMAGE_BUCKET) {
  const bucket = getBucket(bucketName);
  const ext =
    path.extname(file.originalname || "") ||
    (bucketName === VIDEO_BUCKET
      ? file.mimetype?.includes("mp4")
        ? ".mp4"
        : ".webm"
      : ".bin");
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const contentType = guessContentType(filename, file.mimetype, bucketName);

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
        bucket: bucketName,
      },
    });

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => {
      resolve({
        id: uploadStream.id.toString(),
        filename,
        contentType,
        provider: "gridfs",
        bucket: bucketName,
      });
    });

    bufferToStream(file.buffer).pipe(uploadStream);
  });
}

/**
 * Persist an uploaded image to durable storage.
 * Prefers Cloudinary when configured; otherwise stores in MongoDB GridFS
 * so files survive Render/Railway redeploys (unlike local disk).
 */
async function storeImage(file, { baseUrl } = {}) {
  if (!file?.buffer) {
    throw new Error("No image file provided.");
  }

  if (cloudinaryConfigured) {
    return uploadToCloudinary(file, { resourceType: "image", folder: "dipsan/questions" });
  }

  const stored = await uploadToGridFS(file, IMAGE_BUCKET);
  const origin = (baseUrl || "").replace(/\/$/, "");
  return {
    url: `${origin}/api/media/${stored.id}`,
    provider: "gridfs",
    id: stored.id,
  };
}

/**
 * Persist a video solution recording (webm/mp4).
 * Cloudinary uses resource_type "video"; otherwise GridFS video bucket.
 */
async function storeVideo(file, { baseUrl } = {}) {
  if (!file?.buffer) {
    throw new Error("No video file provided.");
  }

  if (cloudinaryConfigured) {
    return uploadToCloudinary(file, {
      resourceType: "video",
      folder: "dipsan/video-solutions",
    });
  }

  const stored = await uploadToGridFS(file, VIDEO_BUCKET);
  const origin = (baseUrl || "").replace(/\/$/, "");
  return {
    url: `${origin}/api/media/${stored.id}`,
    provider: "gridfs",
    id: stored.id,
  };
}

function parseRange(rangeHeader, size) {
  if (!rangeHeader || typeof rangeHeader !== "string") return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return null;

  let start = match[1] === "" ? null : Number(match[1]);
  let end = match[2] === "" ? null : Number(match[2]);

  if (start === null && end === null) return null;
  if (Number.isNaN(start) || Number.isNaN(end)) return null;

  // Suffix form: bytes=-500 → last 500 bytes
  if (start === null) {
    const suffix = end;
    if (suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    if (end === null || end >= size) end = size - 1;
    if (start > end || start >= size) return null;
  }

  return { start, end };
}

/**
 * Stream a GridFS file with full HTTP Range support so <video> can play/seek.
 */
async function streamFromBucket(bucketName, _id, req, res) {
  const bucket = getBucket(bucketName);
  const files = await bucket.find({ _id }).toArray();
  if (!files.length) return false;

  const file = files[0];
  const size = file.length || 0;
  const contentType = guessContentType(file.filename, file.contentType, bucketName);

  res.setHeader("Content-Type", contentType);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Content-Disposition", `inline; filename="${file.filename || "media"}"`);
  // Needed when Vercel client plays media hosted on Render
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  const range = parseRange(req.headers.range, size);

  if (range) {
    const { start, end } = range;
    const chunkSize = end - start + 1;
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    res.setHeader("Content-Length", chunkSize);

    return new Promise((resolve, reject) => {
      const download = bucket.openDownloadStream(_id, { start, end: end + 1 });
      download.on("error", (err) => {
        if (!res.headersSent) res.status(416);
        reject(err);
      });
      download.on("end", () => resolve(true));
      download.pipe(res);
    });
  }

  if (size) res.setHeader("Content-Length", size);
  res.status(200);

  return new Promise((resolve, reject) => {
    const download = bucket.openDownloadStream(_id);
    download.on("error", reject);
    download.on("end", () => resolve(true));
    download.pipe(res);
  });
}

async function streamGridFSFile(id, req, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  const _id = new mongoose.Types.ObjectId(id);
  // Prefer video bucket for media that looks like video ids used by solutions,
  // but try both — images and videos share the same /api/media/:id route.
  const fromVideos = await streamFromBucket(VIDEO_BUCKET, _id, req, res);
  if (fromVideos) return true;
  return streamFromBucket(IMAGE_BUCKET, _id, req, res);
}

module.exports = {
  storeImage,
  storeVideo,
  streamGridFSFile,
  cloudinaryConfigured,
  BUCKET_NAME: IMAGE_BUCKET,
  IMAGE_BUCKET,
  VIDEO_BUCKET,
};
