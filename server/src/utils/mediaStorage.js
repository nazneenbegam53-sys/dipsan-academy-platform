const mongoose = require("mongoose");
const { Readable } = require("stream");
const path = require("path");
const { cloudinary, isConfigured: cloudinaryConfigured } = require("../config/cloudinary");
const {
  isLikelyWebm,
  isLikelyMp4,
  transcodeBufferToMp4,
} = require("./videoTranscode");

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
    const options = {
      folder,
      resource_type: resourceType,
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
    // Force MP4 so iOS / mobile WebViews can play solution videos.
    if (resourceType === "video") {
      options.format = "mp4";
    }
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve({
        url: result.secure_url,
        provider: "cloudinary",
        publicId: result.public_id,
        duration: result.duration ?? null,
      });
    });
    bufferToStream(file.buffer).pipe(stream);
  });
}

async function uploadToGridFS(file, bucketName = IMAGE_BUCKET, extraMeta = {}) {
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
        ...extraMeta,
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
 * Persist a video solution recording.
 * Converts WebM → MP4 when possible so phones/apps (Safari, WKWebView) can play.
 */
async function storeVideo(file, { baseUrl } = {}) {
  if (!file?.buffer) {
    throw new Error("No video file provided.");
  }

  let toStore = file;
  const mime = (file.mimetype || "").toLowerCase();
  const name = file.originalname || "";

  if (!isLikelyMp4(mime, name) && isLikelyWebm(mime, name)) {
    const mp4 = await transcodeBufferToMp4(file.buffer, {
      inputExt: path.extname(name) || ".webm",
    });
    if (mp4) {
      toStore = {
        ...file,
        buffer: mp4,
        mimetype: "video/mp4",
        originalname: (name || "solution.webm").replace(/\.(webm|mkv)$/i, ".mp4"),
      };
    }
  }

  if (cloudinaryConfigured) {
    return uploadToCloudinary(toStore, {
      resourceType: "video",
      folder: "dipsan/video-solutions",
    });
  }

  const stored = await uploadToGridFS(toStore, VIDEO_BUCKET, {
    transcoded: toStore !== file,
  });
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

async function downloadGridFSBuffer(bucketName, _id) {
  const bucket = getBucket(bucketName);
  const chunks = [];
  return new Promise((resolve, reject) => {
    const download = bucket.openDownloadStream(_id);
    download.on("data", (c) => chunks.push(c));
    download.on("error", reject);
    download.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function findMp4Derivative(sourceId) {
  const bucket = getBucket(VIDEO_BUCKET);
  const files = await bucket
    .find({ "metadata.sourceId": String(sourceId), "metadata.derivative": "mp4" })
    .toArray();
  return files[0] || null;
}

const mp4Jobs = new Map();

/**
 * Ensure an MP4 exists for a GridFS video (cache derivative for mobile/iOS).
 * Returns the ObjectId string to stream, or null if conversion is impossible.
 */
async function ensureMp4Id(sourceId) {
  if (!mongoose.Types.ObjectId.isValid(sourceId)) return null;

  const existingJob = mp4Jobs.get(String(sourceId));
  if (existingJob) return existingJob;

  const job = (async () => {
    const _id = new mongoose.Types.ObjectId(sourceId);

    for (const bucketName of [VIDEO_BUCKET, IMAGE_BUCKET]) {
      const bucket = getBucket(bucketName);
      const files = await bucket.find({ _id }).toArray();
      if (!files.length) continue;

      const file = files[0];
      const contentType = guessContentType(file.filename, file.contentType, bucketName);
      if (isLikelyMp4(contentType, file.filename)) {
        return sourceId;
      }

      const existing = await findMp4Derivative(sourceId);
      if (existing) return existing._id.toString();

      // Cap source size to avoid OOM on free Render instances.
      if ((file.length || 0) > 80 * 1024 * 1024) {
        throw new Error("Video is too large to convert for mobile playback.");
      }

      const input = await downloadGridFSBuffer(bucketName, _id);
      const mp4 = await transcodeBufferToMp4(input, {
        inputExt: path.extname(file.filename || "") || ".webm",
      });
      if (!mp4) {
        throw new Error("MP4 conversion is unavailable on the server.");
      }

      const stored = await uploadToGridFS(
        {
          buffer: mp4,
          mimetype: "video/mp4",
          originalname: `${sourceId}.mp4`,
        },
        VIDEO_BUCKET,
        { sourceId: String(sourceId), derivative: "mp4" }
      );
      return stored.id;
    }

    return null;
  })();

  mp4Jobs.set(String(sourceId), job);
  try {
    return await job;
  } finally {
    mp4Jobs.delete(String(sourceId));
  }
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
  const isVideo = contentType.startsWith("video/");

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", isVideo ? "public, max-age=3600" : "public, max-age=31536000, immutable");
  res.setHeader("Content-Disposition", `inline; filename="${file.filename || "media"}"`);
  // Needed when Vercel client plays media hosted on Render
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Expose-Headers", "Accept-Ranges, Content-Range, Content-Length, Content-Type");

  // MediaRecorder WebM rarely has cue points. Serving 206 byte-ranges makes
  // Chrome/Safari sit on "buffering" forever. Always return the full file for
  // WebM (and other non-MP4 solution recordings under ~100MB).
  const isWebm =
    contentType.includes("webm") ||
    contentType.includes("matroska") ||
    /\.webm$/i.test(file.filename || "");
  const isMp4 =
    contentType.includes("mp4") ||
    contentType.includes("quicktime") ||
    /\.(mp4|mov)$/i.test(file.filename || "");
  const forceFullFile =
    isVideo && (isWebm || (!isMp4 && size > 0 && size < 100 * 1024 * 1024));

  if (forceFullFile) {
    res.setHeader("Accept-Ranges", "none");
  } else {
    res.setHeader("Accept-Ranges", "bytes");
  }

  const range = forceFullFile ? null : parseRange(req.headers.range, size);

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

async function streamGridFSFile(id, req, res, { preferMp4 = false } = {}) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  let playId = id;
  if (preferMp4) {
    try {
      const mp4Id = await ensureMp4Id(id);
      if (mp4Id) playId = mp4Id;
    } catch (err) {
      // Fall through to original file if conversion fails (desktop may still play WebM).
      console.warn("[media] MP4 ensure failed:", err?.message || err);
    }
  }

  const _id = new mongoose.Types.ObjectId(playId);
  const fromVideos = await streamFromBucket(VIDEO_BUCKET, _id, req, res);
  if (fromVideos) return true;
  return streamFromBucket(IMAGE_BUCKET, _id, req, res);
}

module.exports = {
  storeImage,
  storeVideo,
  streamGridFSFile,
  ensureMp4Id,
  cloudinaryConfigured,
  BUCKET_NAME: IMAGE_BUCKET,
  IMAGE_BUCKET,
  VIDEO_BUCKET,
};
