const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, className, rollNumber, phone } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Name, email, password, and role are required." });
  }
  if (!["student", "teacher"].includes(role)) {
    return res.status(400).json({ message: "Role must be 'student' or 'teacher'." });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: "An account with this email already exists." });

  const user = await User.create({ name, email, password, role, className, rollNumber, phone });
  const token = signToken(user);
  res.status(201).json({ token, user: user.toSafeObject() });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ message: "Incorrect email or password." });

  const match = await user.comparePassword(password);
  if (!match) return res.status(401).json({ message: "Incorrect email or password." });

  const token = signToken(user);
  res.json({ token, user: user.toSafeObject() });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

module.exports = { register, login, me };
