const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OtpChallenge = require("../models/OtpChallenge");
const { asyncHandler } = require("../middleware/errorHandler");
const { normalizePhone } = require("../utils/phone");
const { messagingStatus } = require("../utils/messaging");
const { issueAndTextOtp, consumeOtp } = require("../auth/dipsanAuthenticator");

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

/**
 * Step 1 — Sign up: collect profile + send OTP SMS to mobile.
 */
const sendRegisterOtp = asyncHandler(async (req, res) => {
  const { name, phone, role, className, rollNumber } = req.body;

  if (!name || !phone || !role) {
    return res.status(400).json({ message: "Name, mobile number, and role are required." });
  }
  if (!["student", "teacher"].includes(role)) {
    return res.status(400).json({ message: "Role must be 'student' or 'teacher'." });
  }
  const phoneE164 = normalizePhone(phone);
  if (!phoneE164) {
    return res.status(400).json({ message: "Enter a valid mobile number (10-digit India or +country code)." });
  }

  const existingPhone = await User.findOne({ phone: phoneE164 });
  if (existingPhone) {
    return res.status(409).json({ message: "An account with this mobile number already exists. Please log in." });
  }

  await OtpChallenge.deleteMany({ purpose: "register", phone: phoneE164 });

  try {
    const payload = await issueAndTextOtp({
      purpose: "register",
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
  const { challenge, error } = await consumeOtp({
    challengeId: req.body.challengeId,
    purpose: "register",
    otp: req.body.otp,
  });
  if (error) return res.status(error.status).json({ message: error.message });

  const user = await User.create({
    name: challenge.name,
    phone: challenge.phone,
    role: challenge.role,
    className: challenge.className,
    rollNumber: challenge.rollNumber,
    emailVerified: false,
    phoneVerified: true,
  });

  const token = signToken(user);
  res.status(201).json({ token, user: user.toSafeObject() });
});

/**
 * Step 1 — Login: identify by mobile, create an in-app OTP.
 */
const sendLoginOtp = asyncHandler(async (req, res) => {
  const { phone, identifier } = req.body;
  const raw = (identifier || phone || "").toString().trim();
  const phoneE164 = normalizePhone(raw);
  if (!phoneE164) {
    return res.status(400).json({ message: "Enter your mobile number." });
  }

  const user = await User.findOne({ phone: phoneE164 });
  if (!user) {
    return res.status(404).json({ message: "No account found. Please sign up first." });
  }

  await OtpChallenge.deleteMany({ purpose: "login", phone: phoneE164 });

  try {
    const payload = await issueAndTextOtp({
      purpose: "login",
      email: user.email || undefined,
      phone: phoneE164,
      userId: user._id,
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
 * Step 2 — Login: verify OTP and issue JWT.
 */
const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { challenge, error } = await consumeOtp({
    challengeId: req.body.challengeId,
    purpose: "login",
    otp: req.body.otp,
  });
  if (error) return res.status(error.status).json({ message: error.message });

  const user = challenge.userId
    ? await User.findById(challenge.userId)
    : await User.findOne({ phone: challenge.phone });
  if (!user) {
    return res.status(404).json({ message: "Account not found." });
  }

  user.phoneVerified = true;
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
    const payload = await issueAndTextOtp({
      purpose: "link-phone",
      email: req.user.email,
      phone: phoneE164,
      userId: req.user._id,
    });

    res.json({
      message: "OTP sent by SMS to your mobile number.",
      ...payload,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message || "Could not send OTP." });
  }
});

const verifyLinkPhoneOtp = asyncHandler(async (req, res) => {
  const { challenge, error } = await consumeOtp({
    challengeId: req.body.challengeId,
    purpose: "link-phone",
    otp: req.body.otp,
  });
  if (error) return res.status(error.status).json({ message: error.message });

  if (String(challenge.userId) !== String(req.user._id)) {
    return res.status(403).json({ message: "This OTP belongs to a different session." });
  }

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
    message: "Mobile number linked. Use this number to log in with OTP.",
    user: user.toSafeObject(),
  });
});

/** Password login disabled — every user uses OTP. */
const login = asyncHandler(async (_req, res) => {
  return res.status(400).json({
    message: "Password login is disabled. Use OTP with your mobile number.",
  });
});

/** Legacy register blocked — force OTP signup. */
const register = asyncHandler(async (_req, res) => {
  return res.status(400).json({
    message: "Password signup is disabled. Use OTP signup with your mobile number.",
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

const messagingHealth = asyncHandler(async (_req, res) => {
  res.json({ ok: true, messaging: messagingStatus() });
});

/** Teacher: list every student and teacher account (website + app). */
const listAccounts = asyncHandler(async (_req, res) => {
  const users = await User.find({})
    .select("name email phone role className rollNumber phoneVerified createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    counts: {
      total: users.length,
      students: users.filter((u) => u.role === "student").length,
      teachers: users.filter((u) => u.role === "teacher").length,
    },
    users: users.map((u) => ({
      id: u._id,
      name: u.name,
      phone: u.phone || "",
      email: u.email || "",
      role: u.role,
      className: u.className || "",
      rollNumber: u.rollNumber || "",
      phoneVerified: Boolean(u.phoneVerified),
      createdAt: u.createdAt,
    })),
  });
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
  listAccounts,
};
