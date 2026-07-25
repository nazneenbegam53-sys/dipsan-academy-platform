const mongoose = require("mongoose");

// One Attempt = one student's single sitting of one exam: it starts as an
// in-progress record (answers autosave into it), then becomes the permanent
// result record once submitted.
const attemptSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // answers: { [questionId]: { selected: Number|[Number]|value, markedForReview: Boolean, visited: Boolean } }
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },

    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    timeTakenSeconds: { type: Number, default: null },
    status: { type: String, enum: ["in-progress", "submitted", "auto-submitted"], default: "in-progress" },

    score: { type: Number, default: null },
    totalMarks: { type: Number, default: null },
    correctCount: { type: Number, default: null },
    wrongCount: { type: Number, default: null },
    unattemptedCount: { type: Number, default: null },

    violations: [
      {
        type: { type: String, enum: ["tab-blur", "fullscreen-exit", "visibility-hidden"], required: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// A student can attempt the same exam more than once unless you add a check
// in the controller — left flexible on purpose since some academies allow retakes.
attemptSchema.index({ exam: 1, student: 1 });

module.exports = mongoose.model("Attempt", attemptSchema);
