const mongoose = require("mongoose");

// Questions live in their own collection (not embedded) so teachers can
// reuse a question across multiple exams via the question bank (spec #20).
const questionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" }, // optional: null if it's a pure question-bank entry not yet attached
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: { type: String, enum: ["mcq", "multi-correct", "numerical", "true-false", "assertion-reason"], default: "mcq" },

    text: { type: String, required: true },
    imageUrl: { type: String, default: null }, // shown above the options, per spec #7/#8

    // For mcq / multi-correct / true-false / assertion-reason. Not used for "numerical".
    options: { type: [String], default: [] },
    correctOptionIndex: { type: Number, default: null }, // single-correct
    correctOptionIndexes: { type: [Number], default: [] }, // multi-correct

    // For "numerical" type questions (NTA-style value answer)
    correctNumericValue: { type: Number, default: null },
    numericTolerance: { type: Number, default: 0 },

    marks: { type: Number, default: 4 },
    negativeMarks: { type: Number, default: 1 },

    chapter: { type: String, trim: true },
    topic: { type: String, trim: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },

    explanation: { type: String, default: "" },
    // TODO (not implemented): formula/graph/table rich-content blocks, video link,
    // reference image separate from the question image — spec #7 lists these as
    // additional editor fields. `explanation` currently just takes plain text/markdown.
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
