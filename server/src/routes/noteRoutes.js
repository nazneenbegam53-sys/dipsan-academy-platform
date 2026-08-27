const express = require("express");
const { listNotes, createNote, deleteNote } = require("../controllers/noteController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, listNotes);
router.post("/", protect, requireRole("teacher"), createNote);
router.delete("/:id", protect, requireRole("teacher"), deleteNote);

module.exports = router;
