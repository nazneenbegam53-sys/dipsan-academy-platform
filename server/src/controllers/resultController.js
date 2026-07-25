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

// Teacher: every submission for one of their exams.
const listResultsForExam = asyncHandler(async (req, res) => {
  const exam = await ownExamOrFail(req.params.examId, req.user._id, res);
  if (!exam) return;

  const attempts = await Attempt.find({ exam: exam._id, status: { $ne: "in-progress" } })
    .populate("student", "name email className rollNumber")
    .sort({ score: -1 });
  res.json({ attempts });
});

// Teacher: one student's full attempt (answers + violations) for review.
const getResultDetail = asyncHandler(async (req, res) => {
  const exam = await ownExamOrFail(req.params.examId, req.user._id, res);
  if (!exam) return;

  const attempt = await Attempt.findOne({ _id: req.params.attemptId, exam: exam._id }).populate(
    "student",
    "name email className rollNumber"
  );
  if (!attempt) return res.status(404).json({ message: "Result not found." });

  const fullExam = await Exam.findById(exam._id).populate("questions");
  res.json({ attempt, exam: fullExam });
});

// Teacher: violation/security report across an exam (spec #13 "Security Report").
const getViolationReport = asyncHandler(async (req, res) => {
  const exam = await ownExamOrFail(req.params.examId, req.user._id, res);
  if (!exam) return;

  const attempts = await Attempt.find({ exam: exam._id, "violations.0": { $exists: true } })
    .populate("student", "name email");
  const report = attempts.map((a) => ({
    student: a.student,
    violationCount: a.violations.length,
    violations: a.violations,
  }));
  res.json({ report });
});

// TODO (not implemented): CSV/Excel export (spec #23 "Download as PDF, Excel, or CSV").
// Wire up a library like `json2csv` or `exceljs` here and stream the file —
// left as a stub so the route exists but returns JSON for now.
const exportResultsCsv = asyncHandler(async (req, res) => {
  res.status(501).json({ message: "CSV/Excel export isn't implemented yet — this endpoint currently returns JSON only.", note: "TODO" });
});

module.exports = { listResultsForExam, getResultDetail, getViolationReport, exportResultsCsv };
