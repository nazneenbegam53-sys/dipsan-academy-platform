const Exam = require("../models/Exam");
const Question = require("../models/Question");
const Attempt = require("../models/Attempt");
const { gradeAttempt } = require("../utils/scoring");
const { asyncHandler } = require("../middleware/errorHandler");

// Starts (or resumes) a student's attempt at a published exam.
const startAttempt = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.examId, status: "published" });
  if (!exam) return res.status(404).json({ message: "Exam not found or not published." });

  let attempt = await Attempt.findOne({ exam: exam._id, student: req.user._id, status: "in-progress" });
  if (!attempt) {
    attempt = await Attempt.create({ exam: exam._id, student: req.user._id, startedAt: new Date() });
  }
  res.status(201).json({ attempt });
});

// Autosave: called on every answer change / question navigation from the client.
const saveAnswer = asyncHandler(async (req, res) => {
  const { questionId, selected, markedForReview, visited } = req.body;
  const attempt = await Attempt.findOne({ _id: req.params.attemptId, student: req.user._id, status: "in-progress" });
  if (!attempt) return res.status(404).json({ message: "Attempt not found or already submitted." });

  const existing = attempt.answers[questionId] || {};
  attempt.answers[questionId] = {
    ...existing,
    ...(selected !== undefined ? { selected } : {}),
    ...(markedForReview !== undefined ? { markedForReview } : {}),
    ...(visited !== undefined ? { visited } : {}),
  };
  attempt.markModified("answers");
  await attempt.save();
  res.json({ ok: true });
});

// Anti-cheat violation logging (spec #13). Client calls this on tab-blur,
// visibility-hidden, or fullscreen-exit events.
const logViolation = asyncHandler(async (req, res) => {
  const { type } = req.body; // "tab-blur" | "fullscreen-exit" | "visibility-hidden"
  const attempt = await Attempt.findOne({ _id: req.params.attemptId, student: req.user._id, status: "in-progress" }).populate("exam");
  if (!attempt) return res.status(404).json({ message: "Attempt not found or already submitted." });

  attempt.violations.push({ type, at: new Date() });
  await attempt.save();

  const exam = attempt.exam;
  const shouldAutoSubmit =
    exam.antiCheat?.autoSubmitOnViolations && attempt.violations.length >= (exam.antiCheat?.maxViolations || 3);

  res.json({ violationCount: attempt.violations.length, shouldAutoSubmit });
});

// const submitAttempt = asyncHandler(async (req, res) => {
//   const attempt = await Attempt.findOne({ _id: req.params.attemptId, student: req.user._id });
//   if (!attempt) return res.status(404).json({ message: "Attempt not found." });
//   if (attempt.status !== "in-progress") return res.json({ attempt }); // already submitted — idempotent

//   const exam = await Exam.findById(attempt.exam).populate("questions");
//   const graded = gradeAttempt(exam.questions, attempt.answers);

//   attempt.submittedAt = new Date();
//   attempt.timeTakenSeconds = Math.round((attempt.submittedAt - attempt.startedAt) / 1000);
//   attempt.status = req.body.auto ? "auto-submitted" : "submitted";
//   Object.assign(attempt, graded);
//   await attempt.save();

//   res.json({ attempt });
// });

const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findOne({
    _id: req.params.attemptId,
    student: req.user._id,
  });

  if (!attempt)
    return res.status(404).json({ message: "Attempt not found." });

  if (attempt.status !== "in-progress")
    return res.json({ attempt });

  const exam = await Exam.findById(attempt.exam).populate("questions");

  const graded = gradeAttempt(exam.questions, attempt.answers);

  attempt.submittedAt = new Date();
  attempt.timeTakenSeconds = Math.round(
    (attempt.submittedAt - attempt.startedAt) / 1000
  );
  attempt.status = req.body.auto ? "auto-submitted" : "submitted";

  Object.assign(attempt, graded);

  console.log("Saving attempt...");
  console.log(attempt);

  await attempt.save();

  console.log("Attempt saved!");

  res.json({ attempt });
});

// Student: full result + solutions for one of their own attempts.
// const getMyAttemptResult = asyncHandler(async (req, res) => {
//   const attempt = await Attempt.findOne({ _id: req.params.attemptId, student: req.user._id });
//   if (!attempt) return res.status(404).json({ message: "Attempt not found." });
//   if (attempt.status === "in-progress") return res.status(400).json({ message: "This attempt hasn't been submitted yet." });

//   const exam = await Exam.findById(attempt.exam).populate("questions");
//   res.json({ attempt, exam });
// });

const getMyAttemptResult = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findOne({
    _id: req.params.attemptId,
    student: req.user._id,
  });

  if (!attempt)
    return res.status(404).json({ message: "Attempt not found." });

  if (attempt.status === "in-progress")
    return res.status(400).json({
      message: "This attempt hasn't been submitted yet.",
    });

  const exam = await Exam.findById(attempt.exam).populate("questions");

  res.json({
    attempt: {
      ...attempt.toObject(),
      answers: attempt.answers || {},
    },
    exam,
  });
});

// Student: list of their own past attempts (spec #17 "Performance History").
const listMyAttempts = asyncHandler(async (req, res) => {
  const attempts = await Attempt.find({ student: req.user._id, status: { $ne: "in-progress" } })
    .populate("exam", "title subject")
    .sort({ submittedAt: -1 });
  res.json({ attempts });
});

module.exports = { startAttempt, saveAnswer, logViolation, submitAttempt, getMyAttemptResult, listMyAttempts };
