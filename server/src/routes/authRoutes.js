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
  messagingHealth,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/otp/register/send", sendRegisterOtp);
router.post("/otp/register/verify", verifyRegisterOtp);
router.post("/otp/login/send", sendLoginOtp);
router.post("/otp/login/verify", verifyLoginOtp);
router.post("/otp/phone/send", protect, sendLinkPhoneOtp);
router.post("/otp/phone/verify", protect, verifyLinkPhoneOtp);
router.get("/messaging-status", messagingHealth);
router.get("/me", protect, me);

module.exports = router;
