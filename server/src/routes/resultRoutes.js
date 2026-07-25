const express = require("express");
const {
  listResultsForExam, getResultDetail, getViolationReport, exportResultsCsv,
} = require("../controllers/resultController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/:examId", protect, requireRole("teacher"), listResultsForExam);
router.get("/:examId/violations", protect, requireRole("teacher"), getViolationReport);
router.get("/:examId/export", protect, requireRole("teacher"), exportResultsCsv);
router.get("/:examId/:attemptId", protect, requireRole("teacher"), getResultDetail);

module.exports = router;
