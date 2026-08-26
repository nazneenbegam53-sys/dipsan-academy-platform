/**
 * Dipsan authenticator — OTP for sign-up and password reset only.
 * Login uses mobile number + password. No SMS/voice gateway.
 */

const OtpChallenge = require("../models/OtpChallenge");
const { messagingStatus } = require("../utils/messaging");

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

  return {
    challengeId: challenge._id.toString(),
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    sentTo: { sms: false, inApp: true, email: false },
    messaging: messagingStatus(),
    otp: code,
    devOtp: code,
  };
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
