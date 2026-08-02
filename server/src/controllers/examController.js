const Exam = require("../models/Exam");
const Question = require("../models/Question");
const Attempt = require("../models/Attempt");
const { asyncHandler } = require("../middleware/errorHandler");

// Teacher: list exams they created
const listMyExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ createdBy: req.user._id })
    .sort({ createdAt: -1 })
    .select("title subject durationMinutes status questions defaultMarks createdAt");

  const examIds = exams.map((e) => e._id);
  const submissionCounts = examIds.length
    ? await Attempt.aggregate([
        {
          $match: {
            exam: { $in: examIds },
            status: { $in: ["submitted", "auto-submitted"] },
          },
        },
        { $group: { _id: "$exam", count: { $sum: 1 } } },
      ])
    : [];
  const submissionsByExam = Object.fromEntries(
    submissionCounts.map((row) => [row._id.toString(), row.count])
  );

  const withCounts = exams.map((e) => ({
    ...e.toObject(),
    questionCount: e.questions.length,
    totalMarks: e.questions.length * e.defaultMarks,
    submissionCount: submissionsByExam[e._id.toString()] || 0,
  }));
  res.json({ exams: withCounts });
});

// Student: list published exams available to take
const listPublishedExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ status: "published" })
    .sort({ createdAt: -1 })
    .select("title subject durationMinutes questions defaultMarks defaultNegativeMarks");
  const withCounts = exams.map((e) => ({
    ...e.toObject(),
    questionCount: e.questions.length,
    totalMarks: e.questions.length * e.defaultMarks,
  }));
  res.json({ exams: withCounts });
});

const createExam = asyncHandler(async (req, res) => {
  const { title, subject, durationMinutes, instructions, defaultMarks, defaultNegativeMarks, passingMarks, antiCheat } = req.body;
  if (!title || !subject) return res.status(400).json({ message: "Title and subject are required." });

  const exam = await Exam.create({
    title, subject, durationMinutes, instructions, defaultMarks, defaultNegativeMarks, passingMarks, antiCheat,
    createdBy: req.user._id,
  });
  res.status(201).json({ exam });
});

const getExamForTeacher = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id }).populate("questions");
  if (!exam) return res.status(404).json({ message: "Exam not found." });
  res.json({ exam });
});

// Student-facing exam fetch — must NOT leak correct answers/explanations.
const getExamForStudent = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, status: "published" })
    .populate({
      path: "questions",
      select:
        "-correctOptionIndex -correctOptionIndexes -correctNumericValue -explanation -explanationImageUrl",
    });
  if (!exam) return res.status(404).json({ message: "Exam not found or not published." });
  res.json({ exam });
});

const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!exam) return res.status(404).json({ message: "Exam not found." });

  const editable = ["title", "subject", "durationMinutes", "instructions", "defaultMarks", "defaultNegativeMarks", "passingMarks", "antiCheat"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) exam[field] = req.body[field];
  });
  await exam.save();
  res.json({ exam });
});

const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!exam) return res.status(404).json({ message: "Exam not found." });
  await Question.deleteMany({ exam: exam._id });
  await exam.deleteOne();
  // Note: existing Attempt/result documents referencing this exam are intentionally
  // left in place so historical results aren't silently lost — clean those up
  // separately if you want a hard delete.
  res.json({ message: "Exam deleted." });
});

const setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // "draft" | "published" | "archived"
  if (!["draft", "published", "archived"].includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }
  const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!exam) return res.status(404).json({ message: "Exam not found." });

  if (status === "published" && exam.questions.length === 0) {
    return res.status(400).json({ message: "Add at least one question before publishing." });
  }
  exam.status = status;
  await exam.save();
  res.json({ exam });
});

module.exports = {
  listMyExams,
  listPublishedExams,
  createExam,
  getExamForTeacher,
  getExamForStudent,
  updateExam,
  deleteExam,
  setStatus,
};
