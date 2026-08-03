const mongoose = require("mongoose");
const { Readable } = require("stream");
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
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${
    require("path").extname(file.originalname || "") || ".bin"
  }`;

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: file.mimetype,
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
        contentType: file.mimetype,
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

async function streamFromBucket(bucketName, _id, res) {
  const bucket = getBucket(bucketName);
  const files = await bucket.find({ _id }).toArray();
  if (!files.length) return false;

  const file = files[0];
  res.setHeader("Content-Type", file.contentType || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);

  return new Promise((resolve, reject) => {
    const download = bucket.openDownloadStream(_id);
    download.on("error", reject);
    download.on("end", () => resolve(true));
    download.pipe(res);
  });
}

async function streamGridFSFile(id, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  const _id = new mongoose.Types.ObjectId(id);
  // Try image bucket first, then video bucket
  const fromImages = await streamFromBucket(IMAGE_BUCKET, _id, res);
  if (fromImages) return true;
  return streamFromBucket(VIDEO_BUCKET, _id, res);
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
