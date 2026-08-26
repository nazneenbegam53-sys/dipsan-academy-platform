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

function fast2smsKey() {
  return String(process.env.FAST2SMS_API_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

/** Free / low-cost India SMS via Fast2SMS (https://www.fast2sms.com). */
function smsConfigured() {
  return Boolean(fast2smsKey());
}

function indianMobile10(phone) {
  const e164 = normalizePhone(phone);
  if (!e164) return null;
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 10) return digits;
  // International: Fast2SMS free/OTP routes are India-only; still try last 10 digits.
  if (digits.length > 10) return digits.slice(-10);
  return null;
}

function providerMessage(data) {
  const raw = data && data.message;
  if (Array.isArray(raw)) return raw.filter(Boolean).join(" ");
  if (raw == null) return "";
  return String(raw);
}

function otpInApp() {
  // Default: OTP is created and checked in our database and shown on screen.
  // Real carrier SMS always needs a gateway (Fast2SMS etc). Opt in with OTP_DELIVERY=sms.
  const v = String(process.env.OTP_DELIVERY || "in_app").trim().toLowerCase();
  return v !== "sms";
}

function otpRoute() {
  const r = String(process.env.FAST2SMS_OTP_ROUTE || "otp").trim().toLowerCase();
  // Quick SMS (q) and DLT (dlt) cannot send login OTP without TRAI DLT templates.
  if (!r || r === "q" || r === "dlt" || r === "quick") return "otp";
  return r;
}

function userFacingSmsError(status, data) {
  const text = providerMessage(data).toLowerCase();
  if (
    status === 401 ||
    status === 403 ||
    text.includes("invalid authorization") ||
    text.includes("invalid api") ||
    (text.includes("authorization") && text.includes("invalid"))
  ) {
    return "Fast2SMS API key was rejected. Open Render → Environment and paste the key from Fast2SMS → Dev API (no quotes or spaces).";
  }
  if (
    text.includes("wallet") ||
    text.includes("balance") ||
    text.includes("insufficient") ||
    text.includes("low credit") ||
    text.includes("recharge")
  ) {
    return "Fast2SMS wallet has no SMS credits. Add balance in Fast2SMS, then try again.";
  }
  if (text.includes("dlt")) {
    return "Quick SMS / DLT cannot send this OTP. In Render, you can leave FAST2SMS_ROUTE unused. Login uses Fast2SMS OTP SMS only. In Fast2SMS open OTP SMS, add OTP wallet credits, and turn IP whitelist off.";
  }
  if (text.includes("invalid number") || text.includes("invalid mobile")) {
    return "That mobile number was rejected. Use a 10-digit Indian number.";
  }
  return "Could not send SMS OTP. Check Fast2SMS wallet credits and that IP whitelist is off in Fast2SMS Security.";
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

function throwSmsFailure(status, data) {
  const detail = providerMessage(data) || JSON.stringify(data || {}).slice(0, 200);
  const err = new Error(`Fast2SMS failed (${status}): ${detail}`);
  err.userMessage = userFacingSmsError(status, data);
  throw err;
}

async function parseFast2smsResponse(res) {
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.return !== false, status: res.status, data };
}

async function fast2smsRequest(payload) {
  const key = fast2smsKey();
  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: key,
      Accept: "*/*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const parsed = await parseFast2smsResponse(res);
  if (!parsed.ok) throwSmsFailure(parsed.status, parsed.data);
  return { ok: true, provider: "fast2sms" };
}

/** Fast2SMS OTP SMS: GET bulkV2 with route=otp only (Quick SMS `q` needs DLT). */
async function fast2smsSendOtp({ number, otp }) {
  const key = fast2smsKey();
  const otpId = String(process.env.FAST2SMS_OTP_ID || "").trim();

  if (otpId) {
    const res = await fetch("https://www.fast2sms.com/dev/otp/send", {
      method: "POST",
      headers: {
        authorization: key,
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mobile: number,
        otp_id: otpId,
        otp,
        otp_length: String(otp).length,
        otp_expiry: 10,
      }),
    });
    const parsed = await parseFast2smsResponse(res);
    if (!parsed.ok) throwSmsFailure(parsed.status, parsed.data);
    return { ok: true, provider: "fast2sms" };
  }

  const params = new URLSearchParams({
    authorization: key,
    route: otpRoute(),
    variables_values: otp,
    numbers: number,
  });
  const res = await fetch(`https://www.fast2sms.com/dev/bulkV2?${params.toString()}`, {
    method: "GET",
    headers: { authorization: key, Accept: "*/*" },
  });
  const parsed = await parseFast2smsResponse(res);
  if (!parsed.ok) throwSmsFailure(parsed.status, parsed.data);
  return { ok: true, provider: "fast2sms" };
}

/**
 * Send an SMS text (notifications) via Fast2SMS Quick SMS.
 */
async function sendSms({ to, body }) {
  const number = indianMobile10(to);
  if (!number) return { ok: false, skipped: true, reason: "invalid-phone" };

  if (otpInApp() || !smsConfigured()) {
    console.log(`[sms:skip] To: ${number}\n${body}`);
    return { ok: true, skipped: true, inApp: otpInApp() };
  }

  return fast2smsRequest({
    route: process.env.FAST2SMS_ROUTE || "q",
    message: String(body).slice(0, 200),
    numbers: number,
  });
}

/** OTP uses Fast2SMS only when OTP_DELIVERY=sms. */
async function sendOtpSms({ phone, code }) {
  const number = indianMobile10(phone);
  if (!number) return { ok: false, skipped: true, reason: "invalid-phone" };

  const otp = String(code).replace(/\D/g, "");
  if (!otp) {
    const err = new Error("OTP code is empty");
    err.userMessage = "Could not create OTP. Please try again shortly.";
    throw err;
  }

  if (otpInApp() || !smsConfigured()) {
    return { ok: true, inApp: true };
  }

  return fast2smsSendOtp({ number, otp });
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
  const inApp = otpInApp();
  const sms = !inApp && smsConfigured();
  const email = emailConfigured();
  return {
    email,
    sms,
    smsProvider: sms ? "fast2sms" : null,
    otpDelivery: inApp ? "in_app" : "sms",
    otpInApp: inApp,
    otpDevMode: inApp || String(process.env.OTP_DEV_MODE || "").toLowerCase() === "true" || !sms,
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
