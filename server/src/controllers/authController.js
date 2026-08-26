const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OtpChallenge = require("../models/OtpChallenge");
const { asyncHandler } = require("../middleware/errorHandler");
const { normalizePhone, isValidEmail } = require("../utils/phone");
const { sendOtpSms, messagingStatus } = require("../utils/messaging");

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function otpDevEnabled() {
  return messagingStatus().otpDevMode;
}

/** OTP is delivered by SMS text only (not email / WhatsApp). */
async function createAndSendOtp(challengeFields) {
  if (!challengeFields.phone) {
    throw Object.assign(new Error("A mobile number is required to send OTP by SMS."), {
      statusCode: 400,
    });
  }

  const code = OtpChallenge.generateCode();
  const challenge = await OtpChallenge.create({
    ...challengeFields,
    codeHash: OtpChallenge.hashCode(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  try {
    await sendOtpSms({ phone: challenge.phone, code });
  } catch (err) {
    console.error("[otp-sms] failed:", err.message);
    // Still allow verify in OTP_DEV_MODE / when SMS is unset (dev logs the code).
    if (!otpDevEnabled()) {
      await OtpChallenge.deleteOne({ _id: challenge._id });
      throw Object.assign(new Error("Could not send SMS OTP. Please try again shortly."), {
        statusCode: 503,
      });
    }
  }

  const payload = {
    challengeId: challenge._id.toString(),
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    sentTo: { sms: true, email: false },
    messaging: messagingStatus(),
  };
  if (otpDevEnabled()) {
    payload.devOtp = code;
  }
  return payload;
}

async function loadValidChallenge(challengeId, purpose) {
  const challenge = await OtpChallenge.findById(challengeId);
  if (!challenge || challenge.purpose !== purpose || challenge.consumed) {
    return { error: { status: 400, message: "Invalid or expired OTP session. Request a new code." } };
  }
  if (challenge.expiresAt.getTime() < Date.now()) {
    return { error: { status: 400, message: "OTP expired. Request a new code." } };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { error: { status: 429, message: "Too many incorrect attempts. Request a new code." } };
  }
  return { challenge };
}

/**
 * Step 1 — Sign up: collect profile + send OTP SMS to mobile.
 */
const sendRegisterOtp = asyncHandler(async (req, res) => {
  const { name, email, phone, role, className, rollNumber } = req.body;

  if (!name || !email || !phone || !role) {
    return res.status(400).json({ message: "Name, email, mobile number, and role are required." });
  }
  if (!["student", "teacher"].includes(role)) {
    return res.status(400).json({ message: "Role must be 'student' or 'teacher'." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }
  const phoneE164 = normalizePhone(phone);
  if (!phoneE164) {
    return res.status(400).json({ message: "Enter a valid mobile number (10-digit India or +country code)." });
  }

  const emailLc = email.toLowerCase().trim();
  const existingEmail = await User.findOne({ email: emailLc });
  if (existingEmail) {
    return res.status(409).json({ message: "An account with this email already exists. Please log in." });
  }
  const existingPhone = await User.findOne({ phone: phoneE164 });
  if (existingPhone) {
    return res.status(409).json({ message: "An account with this mobile number already exists. Please log in." });
  }

  await OtpChallenge.deleteMany({ purpose: "register", email: emailLc });

  try {
    const payload = await createAndSendOtp({
      purpose: "register",
      email: emailLc,
      phone: phoneE164,
      name: name.trim(),
      role,
      className: className || undefined,
      rollNumber: rollNumber || undefined,
    });

    res.json({
      message: "OTP sent by SMS to your mobile number.",
      ...payload,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message || "Could not send OTP." });
  }
});

/**
 * Step 2 — Sign up: verify OTP and create the account.
 */
const verifyRegisterOtp = asyncHandler(async (req, res) => {
  const { challengeId, otp } = req.body;
  if (!challengeId || !otp) {
    return res.status(400).json({ message: "OTP and session id are required." });
  }

  const { challenge, error } = await loadValidChallenge(challengeId, "register");
  if (error) return res.status(error.status).json({ message: error.message });

  challenge.attempts += 1;
  const match = challenge.codeHash === OtpChallenge.hashCode(String(otp).trim());
  if (!match) {
    await challenge.save();
    return res.status(401).json({ message: "Incorrect OTP. Please try again." });
  }

  challenge.consumed = true;
  await challenge.save();

  const user = await User.create({
    name: challenge.name,
    email: challenge.email,
    phone: challenge.phone,
    role: challenge.role,
    className: challenge.className,
    rollNumber: challenge.rollNumber,
    emailVerified: true,
    phoneVerified: true,
  });

  const token = signToken(user);
  res.status(201).json({ token, user: user.toSafeObject() });
});

/**
 * Step 1 — Login: identify by email or phone, send OTP SMS.
 * If the account has no mobile yet, client must also send `phone` so we can
 * SMS the OTP and link that number on successful verify (all users).
 */
const sendLoginOtp = asyncHandler(async (req, res) => {
  const { email, phone, identifier } = req.body;
  const raw = (identifier || email || phone || "").toString().trim();
  if (!raw) {
    return res.status(400).json({ message: "Enter your email or mobile number." });
  }

  let user = null;
  if (raw.includes("@")) {
    if (!isValidEmail(raw)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    user = await User.findOne({ email: raw.toLowerCase() });
  } else {
    const phoneE164 = normalizePhone(raw);
    if (!phoneE164) {
      return res.status(400).json({ message: "Enter a valid email or mobile number." });
    }
    user = await User.findOne({ phone: phoneE164 });
  }

  if (!user) {
    return res.status(404).json({ message: "No account found. Please sign up first." });
  }

  let smsPhone = user.phone || null;
  let linkingPhone = false;

  if (!smsPhone) {
    const phoneE164 = normalizePhone(req.body.phone || "");
    if (!phoneE164) {
      return res.status(400).json({
        message: "Add your mobile number to receive the SMS OTP.",
        needsPhone: true,
        code: "NEEDS_PHONE",
      });
    }
    const taken = await User.findOne({ phone: phoneE164, _id: { $ne: user._id } });
    if (taken) {
      return res.status(409).json({ message: "This mobile number is already linked to another account." });
    }
    smsPhone = phoneE164;
    linkingPhone = true;
  }

  await OtpChallenge.deleteMany({ purpose: "login", email: user.email });

  try {
    const payload = await createAndSendOtp({
      purpose: "login",
      email: user.email,
      phone: smsPhone,
      // Stash pending phone on challenge when linking for the first time.
      ...(linkingPhone ? { name: `link:${smsPhone}` } : {}),
    });

    res.json({
      message: linkingPhone
        ? "OTP sent by SMS. After verify, this mobile will be saved to your account."
        : "OTP sent by SMS to your registered mobile number.",
      needsPhone: linkingPhone,
      ...payload,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message || "Could not send OTP." });
  }
});

/**
 * Step 2 — Login: verify OTP and issue JWT.
 */
const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { challengeId, otp } = req.body;
  if (!challengeId || !otp) {
    return res.status(400).json({ message: "OTP and session id are required." });
  }

  const { challenge, error } = await loadValidChallenge(challengeId, "login");
  if (error) return res.status(error.status).json({ message: error.message });

  challenge.attempts += 1;
  const match = challenge.codeHash === OtpChallenge.hashCode(String(otp).trim());
  if (!match) {
    await challenge.save();
    return res.status(401).json({ message: "Incorrect OTP. Please try again." });
  }

  challenge.consumed = true;
  await challenge.save();

  const user = await User.findOne({ email: challenge.email });
  if (!user) {
    return res.status(404).json({ message: "Account not found." });
  }

  // First-time mobile link from login challenge (name = "link:+91…").
  if (!user.phone && challenge.phone) {
    const taken = await User.findOne({ phone: challenge.phone, _id: { $ne: user._id } });
    if (taken) {
      return res.status(409).json({ message: "This mobile number is already linked to another account." });
    }
    user.phone = challenge.phone;
  }

  user.emailVerified = true;
  if (user.phone) user.phoneVerified = true;
  await user.save();

  const token = signToken(user);
  res.json({ token, user: user.toSafeObject() });
});

/**
 * Authenticated: send OTP SMS to a new mobile number to link it.
 * Required for every user who signed up before mobile was mandatory.
 */
const sendLinkPhoneOtp = asyncHandler(async (req, res) => {
  const phoneE164 = normalizePhone(req.body.phone);
  if (!phoneE164) {
    return res.status(400).json({ message: "Enter a valid mobile number." });
  }

  const taken = await User.findOne({ phone: phoneE164, _id: { $ne: req.user._id } });
  if (taken) {
    return res.status(409).json({ message: "This mobile number is already linked to another account." });
  }

  await OtpChallenge.deleteMany({ purpose: "link-phone", userId: req.user._id });

  try {
    const payload = await createAndSendOtp({
      purpose: "link-phone",
      email: req.user.email,
      phone: phoneE164,
      userId: req.user._id,
    });

    res.json({
      message: "OTP sent by SMS to this mobile number.",
      ...payload,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message || "Could not send OTP." });
  }
});

const verifyLinkPhoneOtp = asyncHandler(async (req, res) => {
  const { challengeId, otp } = req.body;
  if (!challengeId || !otp) {
    return res.status(400).json({ message: "OTP and session id are required." });
  }

  const { challenge, error } = await loadValidChallenge(challengeId, "link-phone");
  if (error) return res.status(error.status).json({ message: error.message });

  if (String(challenge.userId) !== String(req.user._id)) {
    return res.status(403).json({ message: "This OTP belongs to a different session." });
  }

  challenge.attempts += 1;
  const match = challenge.codeHash === OtpChallenge.hashCode(String(otp).trim());
  if (!match) {
    await challenge.save();
    return res.status(401).json({ message: "Incorrect OTP. Please try again." });
  }

  challenge.consumed = true;
  await challenge.save();

  const taken = await User.findOne({ phone: challenge.phone, _id: { $ne: req.user._id } });
  if (taken) {
    return res.status(409).json({ message: "This mobile number is already linked to another account." });
  }

  const user = await User.findById(req.user._id);
  user.phone = challenge.phone;
  user.phoneVerified = true;
  user.emailVerified = true;
  await user.save();

  res.json({
    message: "Mobile number linked. OTP and SMS notifications will use this number.",
    user: user.toSafeObject(),
  });
});

/** Password login disabled — every user uses OTP. */
const login = asyncHandler(async (_req, res) => {
  return res.status(400).json({
    message: "Password login is disabled. Use OTP with your email or mobile number.",
  });
});

/** Legacy register blocked — force OTP signup. */
const register = asyncHandler(async (_req, res) => {
  return res.status(400).json({
    message: "Password signup is disabled. Use OTP signup with email and mobile number.",
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

const messagingHealth = asyncHandler(async (_req, res) => {
  res.json({ ok: true, messaging: messagingStatus() });
});

module.exports = {
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
};
