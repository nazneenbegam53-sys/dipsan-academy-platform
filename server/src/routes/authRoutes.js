const express = require("express");
const {
  register,
  login,
  me,
  linkPhone,
  messagingHealth,
  listAccounts,
} = require("../controllers/authController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/phone", protect, linkPhone);
router.get("/messaging-status", messagingHealth);
router.get("/me", protect, me);
router.get("/accounts", protect, requireRole("teacher"), listAccounts);

module.exports = router;
