const Exam = require("../models/Exam");
const Question = require("../models/Question");
const { asyncHandler } = require("../middleware/errorHandler");

async function ownExamOrFail(examId, teacherId, res) {
  const exam = await Exam.findOne({ _id: examId, createdBy: teacherId });
  if (!exam) {
    res.status(404).json({ message: "Exam not found." });
    return null;
  }
  return exam;
}

const addQuestion = asyncHandler(async (req, res) => {
  const exam = await ownExamOrFail(req.params.examId, req.user._id, res);
  if (!exam) return;

  const body = req.body;
  if (!body.text) return res.status(400).json({ message: "Question text is required." });

  const question = await Question.create({
    ...body,
    exam: exam._id,
    createdBy: req.user._id,
    marks: body.marks ?? exam.defaultMarks,
    negativeMarks: body.negativeMarks ?? exam.defaultNegativeMarks,
  });

  exam.questions.push(question._id);
  await exam.save();

  res.status(201).json({ question });
});

const updateQuestion = asyncHandler(async (req, res) => {
  const exam = await ownExamOrFail(req.params.examId, req.user._id, res);
  if (!exam) return;

  const question = await Question.findOne({ _id: req.params.questionId, exam: exam._id });
  if (!question) return res.status(404).json({ message: "Question not found." });

  const editable = [
    "type", "text", "imageUrl", "options", "correctOptionIndex", "correctOptionIndexes",
    "correctNumericValue", "numericTolerance", "marks", "negativeMarks",
    "chapter", "topic", "difficulty", "explanation", "explanationImageUrl",
  ];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) question[field] = req.body[field];
  });
  await question.save();
  res.json({ question });
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const exam = await ownExamOrFail(req.params.examId, req.user._id, res);
  if (!exam) return;

  await Question.deleteOne({ _id: req.params.questionId, exam: exam._id });
  exam.questions = exam.questions.filter((qid) => qid.toString() !== req.params.questionId);
  await exam.save();
  res.json({ message: "Question deleted." });
});

// Question bank: every question this teacher has ever written, filterable —
// spec #20 ("teachers can reuse questions across multiple exams").
const listQuestionBank = asyncHandler(async (req, res) => {
  const { subject, chapter, topic, difficulty } = req.query;
  const filter = { createdBy: req.user._id };
  if (chapter) filter.chapter = chapter;
  if (topic) filter.topic = topic;
  if (difficulty) filter.difficulty = difficulty;
  // `subject` isn't a Question field (it lives on Exam) — TODO: denormalize a
  // subject field onto Question if you want bank filtering by subject too.
  const questions = await Question.find(filter).sort({ createdAt: -1 });
  res.json({ questions });
});

// Attach an existing question-bank question to a different exam.
const attachExistingQuestion = asyncHandler(async (req, res) => {
  const exam = await ownExamOrFail(req.params.examId, req.user._id, res);
  if (!exam) return;
  const question = await Question.findOne({ _id: req.body.questionId, createdBy: req.user._id });
  if (!question) return res.status(404).json({ message: "Question not found in your bank." });

  if (!exam.questions.includes(question._id)) {
    exam.questions.push(question._id);
    await exam.save();
  }
  res.json({ exam });
});

module.exports = { addQuestion, updateQuestion, deleteQuestion, listQuestionBank, attachExistingQuestion };
