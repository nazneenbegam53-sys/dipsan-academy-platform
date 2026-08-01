const { asyncHandler } = require("../middleware/errorHandler");
const { storeImage, cloudinaryConfigured } = require("../utils/mediaStorage");

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image uploaded.",
    });
  }

  const proto = req.get("x-forwarded-proto") || req.protocol;
  const host = req.get("x-forwarded-host") || req.get("host");
  const baseUrl = `${proto}://${host}`;

  const stored = await storeImage(req.file, { baseUrl });

  res.json({
    url: stored.url,
    provider: stored.provider,
    durable: true,
    cloudinary: cloudinaryConfigured,
  });
});

module.exports = {
  uploadImage,
};
