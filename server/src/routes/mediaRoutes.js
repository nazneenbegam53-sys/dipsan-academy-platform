const express = require("express");
const { asyncHandler } = require("../middleware/errorHandler");
const { streamGridFSFile } = require("../utils/mediaStorage");

const router = express.Router();

// Public read — exam images must be visible to students during attempts.
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const found = await streamGridFSFile(req.params.id, res);
    if (!found) {
      return res.status(404).json({ message: "Media not found." });
    }
  })
);

module.exports = router;
