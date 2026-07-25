const express = require("express");
const {
  listMyExams, listPublishedExams, createExam, getExamForTeacher,
  getExamForStudent, updateExam, deleteExam, setStatus,
} = require("../controllers/examController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", protect, requireRole("teacher"), listMyExams);
router.get("/published", protect, requireRole("student"), listPublishedExams);

router.post("/", protect, requireRole("teacher"), createExam);
router.get("/:id/teacher-view", protect, requireRole("teacher"), getExamForTeacher);
router.get("/:id/student-view", protect, requireRole("student"), getExamForStudent);
router.patch("/:id", protect, requireRole("teacher"), updateExam);
router.delete("/:id", protect, requireRole("teacher"), deleteExam);
router.patch("/:id/status", protect, requireRole("teacher"), setStatus);

module.exports = router;
