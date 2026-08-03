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
