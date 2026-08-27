const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true, default: "" },
    fileUrl: { type: String, required: true },
    provider: { type: String, enum: ["gridfs", "cloudinary"], default: "gridfs" },
    originalName: { type: String, trim: true, default: "" },
    mimeType: { type: String, default: "application/pdf" },
    size: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

noteSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Note", noteSchema);
