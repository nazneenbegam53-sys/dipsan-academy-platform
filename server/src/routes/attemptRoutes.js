const express = require("express");
const {
  startAttempt, saveAnswer, logViolation, submitAttempt, getMyAttemptResult, listMyAttempts,
} = require("../controllers/attemptController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", protect, requireRole("student"), listMyAttempts);
router.post("/:examId/start", protect, requireRole("student"), startAttempt);
router.post("/:attemptId/answer", protect, requireRole("student"), saveAnswer);
router.post("/:attemptId/violation", protect, requireRole("student"), logViolation);
router.post("/:attemptId/submit", protect, requireRole("student"), submitAttempt);
router.get("/:attemptId/result", protect, requireRole("student"), getMyAttemptResult);

module.exports = router;
