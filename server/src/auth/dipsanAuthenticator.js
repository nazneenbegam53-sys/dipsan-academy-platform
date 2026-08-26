/**
 * Dipsan login authenticator — owned entirely by this codebase.
 *
 * We create a 6-digit OTP, store only a hash in MongoDB, and check the code here.
 * 2Factor / Fast2SMS are used only as a pipe to deliver an SMS text. They do not
 * verify the user (no voice call verification, no 2Factor VERIFY API).
 */

const OtpChallenge = require("../models/OtpChallenge");
const { sendOtpSms, messagingStatus, otpInApp } = require("../utils/messaging");

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

async function issueAndTextOtp(challengeFields) {
  if (!challengeFields.phone) {
    throw Object.assign(new Error("A mobile number is required."), { statusCode: 400 });
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
      console.error("[dipsan-otp] SMS text failed:", err.message);
      await OtpChallenge.deleteOne({ _id: challenge._id });
      throw Object.assign(
        new Error(err.userMessage || "Could not send SMS OTP. Please try again shortly."),
        { statusCode: 503 }
      );
    }
  }

  const payload = {
    challengeId: challenge._id.toString(),
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    sentTo: { sms: !inApp, inApp, email: false },
    messaging: messagingStatus(),
  };
  if (inApp || String(process.env.OTP_DEV_MODE || "").toLowerCase() === "true") {
    payload.otp = code;
    payload.devOtp = code;
  }
  return payload;
}

async function consumeOtp({ challengeId, purpose, otp }) {
  if (!challengeId || !otp) {
    return { error: { status: 400, message: "OTP and session id are required." } };
  }

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

  challenge.attempts += 1;
  const match = challenge.codeHash === OtpChallenge.hashCode(String(otp).trim());
  if (!match) {
    await challenge.save();
    return { error: { status: 401, message: "Incorrect OTP. Please try again." } };
  }

  challenge.consumed = true;
  await challenge.save();
  return { challenge };
}

module.exports = {
  OTP_TTL_MS,
  MAX_ATTEMPTS,
  issueAndTextOtp,
  consumeOtp,
};
