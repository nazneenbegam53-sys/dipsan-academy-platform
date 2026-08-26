const nodemailer = require("nodemailer");

let transporter = null;

function emailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      (process.env.SMTP_FROM || process.env.SMTP_USER)
  );
}

function smsConfigured() {
  return false;
}

/** Dipsan authenticator only — no Fast2SMS / 2Factor / carrier SMS. */
function otpInApp() {
  return true;
}

function getTransporter() {
  if (!emailConfigured()) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  if (!to) return { ok: false, skipped: true, reason: "no-recipient" };
  if (!emailConfigured()) {
    console.log(`[email:dev] To: ${to} | ${subject}\n${text}`);
    return { ok: true, dev: true };
  }
  const tx = getTransporter();
  await tx.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html: html || undefined,
  });
  return { ok: true };
}

async function sendSms() {
  return { ok: true, skipped: true };
}

async function sendOtpSms() {
  return { ok: true, inApp: true, provider: "dipsan" };
}

async function sendNotificationSms() {
  return { ok: true, skipped: true };
}

async function sendResultEmail({ email, subject, text, html }) {
  return sendEmail({ to: email, subject, text, html });
}

function messagingStatus() {
  return {
    email: emailConfigured(),
    sms: false,
    smsProvider: null,
    otpDelivery: "in_app",
    otpInApp: true,
    otpDevMode: true,
    authenticator: "dipsan",
  };
}

module.exports = {
  sendEmail,
  sendSms,
  sendOtpSms,
  sendNotificationSms,
  sendResultEmail,
  emailConfigured,
  smsConfigured,
  otpInApp,
  messagingStatus,
};
