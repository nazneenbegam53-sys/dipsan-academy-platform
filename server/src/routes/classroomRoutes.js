const express = require("express");
const {
  createClassroom,
  listClassrooms,
  getClassroom,
  joinClassroom,
} = require("../controllers/classroomController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, requireRole("teacher"), createClassroom);
router.get("/", protect, listClassrooms);
router.post("/join", protect, joinClassroom);
router.get("/:id", protect, getClassroom);

module.exports = router;
