const { asyncHandler } = require("../middleware/errorHandler");

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image uploaded",
    });
  }

  res.json({
    url: req.file.path,
  });
});

module.exports = {
  uploadImage,
};