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

function userFacingSmsError(status, data) {
  const text = providerMessage(data).toLowerCase();
  if (
    status === 401 ||
    status === 403 ||
    text.includes("invalid authorization") ||
    text.includes("invalid api") ||
    text.includes("authorization")
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
    return "Fast2SMS needs a DLT template for this route. Use OTP SMS (route otp) or add a DLT template.";
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.return === false) {
    // GET is the other documented method; some accounts only succeed this way.
    const params = new URLSearchParams({
      authorization: key,
      ...Object.fromEntries(
        Object.entries(payload).map(([k, v]) => [k, v == null ? "" : String(v)])
      ),
    });
    const getRes = await fetch(`https://www.fast2sms.com/dev/bulkV2?${params.toString()}`, {
      method: "GET",
      headers: { authorization: key, Accept: "*/*" },
    });
    const getData = await getRes.json().catch(() => ({}));
    if (!getRes.ok || getData.return === false) {
      throwSmsFailure(getRes.status || res.status, getData.return === false ? getData : data);
    }
    return { ok: true, provider: "fast2sms" };
  }
  return { ok: true, provider: "fast2sms" };
}

/**
 * Send an SMS text (notifications) via Fast2SMS Quick SMS.
 */
async function sendSms({ to, body }) {
  const number = indianMobile10(to);
  if (!number) return { ok: false, skipped: true, reason: "invalid-phone" };

  if (!smsConfigured()) {
    console.log(`[sms:dev] To: ${number}\n${body}`);
    return { ok: true, dev: true };
  }

  return fast2smsRequest({
    route: process.env.FAST2SMS_ROUTE || "q",
    message: String(body).slice(0, 200),
    numbers: number,
  });
}

/** OTP uses Fast2SMS OTP route (not Quick SMS custom text). */
async function sendOtpSms({ phone, code }) {
  const number = indianMobile10(phone);
  if (!number) return { ok: false, skipped: true, reason: "invalid-phone" };

  const otp = String(code).replace(/\D/g, "");
  if (!otp) {
    const err = new Error("OTP code is empty");
    err.userMessage = "Could not send SMS OTP. Please try again shortly.";
    throw err;
  }

  if (!smsConfigured()) {
    console.log(`[sms:dev] To: ${number}\nYour OTP: ${otp}`);
    return { ok: true, dev: true };
  }

  return fast2smsRequest({
    route: process.env.FAST2SMS_OTP_ROUTE || "otp",
    variables_values: otp,
    numbers: number,
  });
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
