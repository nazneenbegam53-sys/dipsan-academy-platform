const nodemailer = require("nodemailer");
const { normalizePhone } = require("./phone");

let transporter = null;

function emailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      (process.env.SMTP_FROM || process.env.SMTP_USER)
  );
}

/** Free / low-cost India SMS via Fast2SMS (https://www.fast2sms.com). */
function smsConfigured() {
  return Boolean(process.env.FAST2SMS_API_KEY);
}

function indianMobile10(phone) {
  const e164 = normalizePhone(phone);
  if (!e164) return null;
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 10) return digits;
  // International: Fast2SMS free route is India-only; still try last 10 digits.
  if (digits.length > 10) return digits.slice(-10);
  return null;
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

/**
 * Send an SMS text (OTP / notifications) via Fast2SMS.
 * Uses the quick route (`q`) which works with free trial credits.
 */
async function sendSms({ to, body }) {
  const number = indianMobile10(to);
  if (!number) return { ok: false, skipped: true, reason: "invalid-phone" };

  if (!smsConfigured()) {
    console.log(`[sms:dev] To: ${number}\n${body}`);
    return { ok: true, dev: true };
  }

  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: process.env.FAST2SMS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: process.env.FAST2SMS_ROUTE || "q",
      message: String(body).slice(0, 200),
      language: "english",
      flash: 0,
      numbers: number,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.return === false) {
    throw new Error(
      `Fast2SMS failed (${res.status}): ${data.message || JSON.stringify(data).slice(0, 200)}`
    );
  }
  return { ok: true, provider: "fast2sms" };
}

/** OTP goes to SMS only. */
async function sendOtpSms({ phone, code }) {
  const body = `Dipsan Academy OTP: ${code}. Valid 10 min. Do not share.`;
  return sendSms({ to: phone, body });
}

/** In-app notification mirror → SMS text only. */
async function sendNotificationSms({ phone, title, message }) {
  const body = `Dipsan: ${title} — ${message}`.slice(0, 200);
  return sendSms({ to: phone, body });
}

/** Exam result → email only. */
async function sendResultEmail({ email, subject, text, html }) {
  return sendEmail({ to: email, subject, text, html });
}

function messagingStatus() {
  const sms = smsConfigured();
  const email = emailConfigured();
  return {
    email,
    sms,
    smsProvider: sms ? "fast2sms" : null,
    otpDevMode:
      String(process.env.OTP_DEV_MODE || "").toLowerCase() === "true" || !sms,
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
  messagingStatus,
};
