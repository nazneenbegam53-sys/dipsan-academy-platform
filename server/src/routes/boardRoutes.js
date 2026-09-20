const express = require("express");
const {
  createBoard,
  listBoards,
  getBoard,
  getBoardState,
  saveSnapshot,
  applyOperation,
} = require("../controllers/boardController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, requireRole("teacher"), createBoard);
router.get("/", protect, listBoards);
router.get("/:id/state", protect, getBoardState);
router.put("/:id/snapshot", protect, saveSnapshot);
router.post("/:id/operations", protect, applyOperation);
router.get("/:id", protect, getBoard);

module.exports = router;
