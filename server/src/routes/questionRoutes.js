const express = require("express");
const {
  addQuestion, updateQuestion, deleteQuestion, listQuestionBank, attachExistingQuestion,
} = require("../controllers/questionController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/bank", protect, requireRole("teacher"), listQuestionBank);

router.post("/:examId/questions", protect, requireRole("teacher"), addQuestion);
router.patch("/:examId/questions/:questionId", protect, requireRole("teacher"), updateQuestion);
router.delete("/:examId/questions/:questionId", protect, requireRole("teacher"), deleteQuestion);
router.post("/:examId/questions/attach", protect, requireRole("teacher"), attachExistingQuestion);

module.exports = router;
