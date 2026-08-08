const { asyncHandler } = require("../middleware/errorHandler");
const { storeImage, storeVideo, cloudinaryConfigured } = require("../utils/mediaStorage");

function requestBaseUrl(req) {
  const proto = req.get("x-forwarded-proto") || req.protocol;
  const host = req.get("x-forwarded-host") || req.get("host");
  return `${proto}://${host}`;
}

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image uploaded.",
    });
  }

  const stored = await storeImage(req.file, { baseUrl: requestBaseUrl(req) });

  res.json({
    url: stored.url,
    provider: stored.provider,
    durable: true,
    cloudinary: cloudinaryConfigured,
  });
});

const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No video uploaded.",
    });
  }

  // Browsers sometimes send application/octet-stream — normalize so players get a real video MIME.
  const rawMime = (req.file.mimetype || "").toLowerCase().split(";")[0].trim();
  const name = (req.file.originalname || "").toLowerCase();
  if (!rawMime.startsWith("video/") || rawMime === "application/octet-stream") {
    if (name.endsWith(".mp4") || name.endsWith(".m4v") || name.endsWith(".mov")) {
      req.file.mimetype = name.endsWith(".mov") ? "video/quicktime" : "video/mp4";
    } else {
      req.file.mimetype = "video/webm";
    }
  }

  const stored = await storeVideo(req.file, { baseUrl: requestBaseUrl(req) });

  res.json({
    url: stored.url,
    provider: stored.provider,
    duration: stored.duration ?? null,
    durable: true,
    cloudinary: cloudinaryConfigured,
  });
});

module.exports = {
  uploadImage,
  uploadVideo,
};
