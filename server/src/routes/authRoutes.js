const express = require("express");
const {
  register,
  login,
  me,
  sendRegisterOtp,
  verifyRegisterOtp,
  sendLoginOtp,
  verifyLoginOtp,
  sendLinkPhoneOtp,
  verifyLinkPhoneOtp,
  sendSetPasswordOtp,
  verifySetPasswordOtp,
  messagingHealth,
  listAccounts,
} = require("../controllers/authController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/otp/register/send", sendRegisterOtp);
router.post("/otp/register/verify", verifyRegisterOtp);
router.post("/otp/login/send", sendLoginOtp);
router.post("/otp/login/verify", verifyLoginOtp);
router.post("/otp/password/send", sendSetPasswordOtp);
router.post("/otp/password/verify", verifySetPasswordOtp);
router.post("/otp/phone/send", protect, sendLinkPhoneOtp);
router.post("/otp/phone/verify", protect, verifyLinkPhoneOtp);
router.get("/messaging-status", messagingHealth);
router.get("/me", protect, me);
router.get("/accounts", protect, requireRole("teacher"), listAccounts);

module.exports = router;
