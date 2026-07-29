const path = require("path");
const { asyncHandler } = require("../middleware/errorHandler");

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image uploaded.",
    });
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.json({
    url: `${baseUrl}/uploads/${path.basename(req.file.path)}`,
    local: true,
  });
});

module.exports = {
  uploadImage,
};