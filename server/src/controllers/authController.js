const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OtpChallenge = require("../models/OtpChallenge");
const { asyncHandler } = require("../middleware/errorHandler");
const { normalizePhone } = require("../utils/phone");
const { sendOtpSms, messagingStatus, otpInApp } = require("../utils/messaging");

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

/** OTP is generated in our database. Shown on screen unless OTP_DELIVERY=sms. */
async function createAndSendOtp(challengeFields) {
  if (!challengeFields.phone) {
    throw Object.assign(new Error("A mobile number is required."), {
      statusCode: 400,
    });
  }

  const code = OtpChallenge.generateCode();
  const challenge = await OtpChallenge.create({
    ...challengeFields,
    codeHash: OtpChallenge.hashCode(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  const inApp = otpInApp();
  if (!inApp) {
    try {
      await sendOtpSms({ phone: challenge.phone, code });
    } catch (err) {
      console.error("[otp-sms] failed:", err.message);
      if (!otpDevEnabled()) {
        await OtpChallenge.deleteOne({ _id: challenge._id });
        throw Object.assign(
          new Error(err.userMessage || "Could not send SMS OTP. Please try again shortly."),
          { statusCode: 503 }
        );
      }
    }
  }

  const payload = {
    challengeId: challenge._id.toString(),
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    sentTo: { sms: !inApp, inApp, email: false },
    messaging: messagingStatus(),
  };
  if (inApp || otpDevEnabled()) {
    payload.otp = code;
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
    const payload = await createAndSendOtp({
      purpose: "register",
      phone: phoneE164,
      name: name.trim(),
      role,
      className: className || undefined,
      rollNumber: rollNumber || undefined,
    });

    res.json({
      message: "Enter the OTP shown on this screen.",
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
    const payload = await createAndSendOtp({
      purpose: "login",
      email: user.email || undefined,
      phone: phoneE164,
      userId: user._id,
    });

    res.json({
      message: "Enter the OTP shown on this screen.",
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
    const payload = await createAndSendOtp({
      purpose: "link-phone",
      email: req.user.email,
      phone: phoneE164,
      userId: req.user._id,
    });

    res.json({
      message: "Enter the OTP shown on this screen.",
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
