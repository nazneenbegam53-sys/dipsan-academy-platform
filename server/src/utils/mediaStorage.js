const mongoose = require("mongoose");
const { Readable } = require("stream");
const { cloudinary, isConfigured: cloudinaryConfigured } = require("../config/cloudinary");

const BUCKET_NAME = "questionImages";

function getBucket() {
  if (!mongoose.connection?.db) {
    throw new Error("MongoDB is not connected yet.");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: BUCKET_NAME,
  });
}

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

async function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "dipsan/questions",
        resource_type: "image",
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          provider: "cloudinary",
          publicId: result.public_id,
        });
      }
    );
    bufferToStream(file.buffer).pipe(stream);
  });
}

async function uploadToGridFS(file) {
  const bucket = getBucket();
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${
    require("path").extname(file.originalname || "") || ".bin"
  }`;

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    });

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => {
      resolve({
        id: uploadStream.id.toString(),
        filename,
        contentType: file.mimetype,
        provider: "gridfs",
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
    return uploadToCloudinary(file);
  }

  const stored = await uploadToGridFS(file);
  const origin = (baseUrl || "").replace(/\/$/, "");
  return {
    url: `${origin}/api/media/${stored.id}`,
    provider: "gridfs",
    id: stored.id,
  };
}

async function streamGridFSFile(id, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }

  const bucket = getBucket();
  const _id = new mongoose.Types.ObjectId(id);
  const files = await bucket.find({ _id }).toArray();
  if (!files.length) return false;

  const file = files[0];
  res.setHeader("Content-Type", file.contentType || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);

  return new Promise((resolve, reject) => {
    const download = bucket.openDownloadStream(_id);
    download.on("error", reject);
    download.on("end", () => resolve(true));
    download.pipe(res);
  });
}

module.exports = {
  storeImage,
  streamGridFSFile,
  cloudinaryConfigured,
  BUCKET_NAME,
};
