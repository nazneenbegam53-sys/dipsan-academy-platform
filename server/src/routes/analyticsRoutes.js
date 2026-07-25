const express = require("express");
const { getExamAnalytics, getTeacherDashboard } = require("../controllers/analyticsController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", protect, requireRole("teacher"), getTeacherDashboard);
router.get("/:examId", protect, requireRole("teacher"), getExamAnalytics);

module.exports = router;
