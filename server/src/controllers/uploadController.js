const path = require("path");
const { cloudinary, isConfigured } = require("../config/cloudinary");
const { asyncHandler } = require("../middleware/errorHandler");

// multer (configured in routes/uploadRoutes.js) puts the file at req.file.
// If Cloudinary credentials are set, upload there and return the CDN URL.
// Otherwise fall back to serving the file straight off local disk via /uploads/<filename>
// (fine for local dev; most hosts wipe local disk on redeploy, so swap in real
// Cloudinary credentials before you rely on this in production).
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No image file was sent." });

  if (isConfigured) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "dipsan-academy/questions",
    });
    return res.json({ url: result.secure_url });
  }

  //const relativeUrl = `/uploads/${path.basename(req.file.path)}`;
  //return res.json({ url: relativeUrl, local: true });
  const baseUrl = `${req.protocol}://${req.get("host")}`;

return res.json({
  url: `${baseUrl}/uploads/${path.basename(req.file.path)}`,
  local: true,
});
});

module.exports = { uploadImage };
