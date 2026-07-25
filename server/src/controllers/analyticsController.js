const mongoose = require("mongoose");
const Exam = require("../models/Exam");
const Attempt = require("../models/Attempt");
const { asyncHandler } = require("../middleware/errorHandler");

async function ownExamOrFail(examId, teacherId, res) {
  const exam = await Exam.findOne({ _id: examId, createdBy: teacherId });
  if (!exam) {
    res.status(404).json({ message: "Exam not found." });
    return null;
  }
  return exam;
}

// Spec #22: average/highest/lowest score, pass %, question-wise accuracy,
// average time per question.
const getExamAnalytics = asyncHandler(async (req, res) => {
  const exam = await ownExamOrFail(req.params.examId, req.user._id, res);
  if (!exam) return;

  const attempts = await Attempt.find({ exam: exam._id, status: { $ne: "in-progress" } }).populate("exam", "questions passingMarks");
  if (attempts.length === 0) {
    return res.json({
      submissionCount: 0, averageScore: 0, highestScore: 0, lowestScore: 0,
      passPercentage: 0, averageTimeSeconds: 0, questionAccuracy: [],
    });
  }

  const scores = attempts.map((a) => a.score || 0);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const passCount = attempts.filter((a) => (a.score || 0) >= (exam.passingMarks || 0)).length;
  const averageTimeSeconds = attempts.reduce((a, b) => a + (b.timeTakenSeconds || 0), 0) / attempts.length;

  // Question-wise accuracy: % of students who got each question correct.
  const populatedExam = await Exam.findById(exam._id).populate("questions");
  const questionAccuracy = populatedExam.questions.map((q) => {
    let correct = 0;
    let attempted = 0;
    attempts.forEach((a) => {
      const entry = a.answers[q._id.toString()];
      if (!entry || entry.selected === undefined || entry.selected === null) return;
      attempted++;
      const isCorrect =
        q.type === "numerical"
          ? Math.abs(Number(entry.selected) - Number(q.correctNumericValue)) <= (q.numericTolerance || 0)
          : Number(entry.selected) === q.correctOptionIndex;
      if (isCorrect) correct++;
    });
    return {
      questionId: q._id,
      text: q.text.slice(0, 80),
      chapter: q.chapter,
      topic: q.topic,
      attempted,
      accuracyPercent: attempted ? Math.round((correct / attempted) * 100) : 0,
    };
  });

  res.json({
    submissionCount: attempts.length,
    averageScore: Math.round(averageScore * 100) / 100,
    highestScore,
    lowestScore,
    passPercentage: Math.round((passCount / attempts.length) * 100),
    averageTimeSeconds: Math.round(averageTimeSeconds),
    questionAccuracy,
  });
});

// Teacher dashboard summary across all their exams (spec #18).
const getTeacherDashboard = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ createdBy: req.user._id });
  const examIds = exams.map((e) => e._id);

  const recentAttempts = await Attempt.find({ exam: { $in: examIds }, status: { $ne: "in-progress" } })
    .populate("exam", "title")
    .populate("student", "name")
    .sort({ submittedAt: -1 })
    .limit(10);

  const allAttempts = await Attempt.find({ exam: { $in: examIds }, status: { $ne: "in-progress" } });
  const averageMarks = allAttempts.length
    ? Math.round((allAttempts.reduce((a, b) => a + (b.score || 0), 0) / allAttempts.length) * 100) / 100
    : 0;

  res.json({
    examCount: exams.length,
    publishedCount: exams.filter((e) => e.status === "published").length,
    studentSubmissionCount: allAttempts.length,
    averageMarks,
    recentResults: recentAttempts,
  });
});

// TODO (not implemented, spec #26 "Future AI Features"): AI weak-topic detection,
// AI study plan generation, AI question/solution generation. These would call
// out to an LLM API with the student's per-chapter accuracy (already computable
// from questionAccuracy above) — left as a clear extension point, not built.

module.exports = { getExamAnalytics, getTeacherDashboard };
