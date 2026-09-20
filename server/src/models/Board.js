const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    pageNumber: { type: Number, required: true },
    title: { type: String, default: "Page 1", trim: true },
    backgroundColor: { type: String, default: "#0B1824" },
  },
  { _id: false }
);

const objectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    rotation: { type: Number, default: 0 },
    zIndex: { type: Number, default: 0 },
    style: { type: mongoose.Schema.Types.Mixed, default: {} },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pageNumber: { type: Number, default: 1 },
    deleted: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    title: { type: String, required: true, trim: true, default: "Whiteboard" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    studentEditingLocked: { type: Boolean, default: true },
    currentPage: { type: Number, default: 1 },
    version: { type: Number, default: 0 },
    pages: {
      type: [pageSchema],
      default: () => [{ pageNumber: 1, title: "Page 1", backgroundColor: "#0B1824" }],
    },
    objects: { type: [objectSchema], default: [] },
  },
  { timestamps: true }
);

boardSchema.index({ classroom: 1, updatedAt: -1 });

module.exports = mongoose.model("Board", boardSchema);
