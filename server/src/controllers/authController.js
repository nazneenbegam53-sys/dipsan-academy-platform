const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OtpChallenge = require("../models/OtpChallenge");
const { asyncHandler } = require("../middleware/errorHandler");
const { normalizePhone, isValidEmail } = require("../utils/phone");
const { sendChannels, messagingStatus } = require("../utils/messaging");

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

async function createAndSendOtp(challengeFields) {
  const code = OtpChallenge.generateCode();
  const challenge = await OtpChallenge.create({
    ...challengeFields,
    codeHash: OtpChallenge.hashCode(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  const subject = "Dipsan Academy verification code";
  const text = `Your Dipsan Academy OTP is ${code}. It expires in 10 minutes. Do not share this code.`;
  const html = `<p>Your Dipsan Academy OTP is <strong style="font-size:18px;letter-spacing:2px">${code}</strong>.</p><p>It expires in 10 minutes. Do not share this code.</p>`;

  await sendChannels({
    email: challenge.email,
    phone: challenge.phone,
    subject,
    text,
    html,
  });

  const payload = {
    challengeId: challenge._id.toString(),
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    sentTo: {
      email: Boolean(challenge.email),
      whatsapp: Boolean(challenge.phone),
    },
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
 * Step 1 — Sign up: collect profile + send OTP to email and WhatsApp.
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
    message: "OTP sent to your email and WhatsApp.",
    ...payload,
  });
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
 * Step 1 — Login: identify by email or phone, send OTP to both channels on file.
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
  if (!user.phone) {
    return res.status(400).json({
      message:
        "This account has no mobile number on file. Add a phone via support, or use password login if you still have one.",
    });
  }

  await OtpChallenge.deleteMany({ purpose: "login", email: user.email });

  const payload = await createAndSendOtp({
    purpose: "login",
    email: user.email,
    phone: user.phone,
  });

  res.json({
    message: "OTP sent to your registered email and WhatsApp.",
    ...payload,
  });
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

  user.emailVerified = true;
  user.phoneVerified = true;
  await user.save();

  const token = signToken(user);
  res.json({ token, user: user.toSafeObject() });
});

/** Legacy password login (existing accounts). Prefer OTP. */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !user.password) {
    return res.status(401).json({ message: "Use OTP login with your email or mobile number." });
  }

  const match = await user.comparePassword(password);
  if (!match) return res.status(401).json({ message: "Incorrect email or password." });

  const token = signToken(user);
  res.json({ token, user: user.toSafeObject() });
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
  messagingHealth,
};
