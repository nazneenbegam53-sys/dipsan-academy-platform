const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true }, // "NEET" | "JEE Main" | "JEE Advanced" | custom
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    durationMinutes: { type: Number, required: true, default: 60 },
    instructions: { type: String, default: "" },

    // Uniform marking scheme applied at grading time (per-question override also
    // supported since Question has its own marks/negativeMarks).
    defaultMarks: { type: Number, default: 4 },
    defaultNegativeMarks: { type: Number, default: 1 },
    passingMarks: { type: Number, default: 0 },

    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    scheduledStart: { type: Date, default: null }, // TODO: not enforced yet — publish is instant regardless of this field

    // Anti-cheat configuration (spec #13)
    antiCheat: {
      requireFullscreen: { type: Boolean, default: true },
      autoSubmitOnViolations: { type: Boolean, default: false },
      maxViolations: { type: Number, default: 3 }, // used only if autoSubmitOnViolations is true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);
