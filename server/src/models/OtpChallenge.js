const mongoose = require("mongoose");
const crypto = require("crypto");

const otpChallengeSchema = new mongoose.Schema(
  {
    purpose: { type: String, enum: ["register", "login"], required: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    // Pending registration payload
    name: { type: String, trim: true },
    role: { type: String, enum: ["student", "teacher"] },
    className: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    consumed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpChallengeSchema.statics.hashCode = function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
};

otpChallengeSchema.statics.generateCode = function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
};

module.exports = mongoose.model("OtpChallenge", otpChallengeSchema);
