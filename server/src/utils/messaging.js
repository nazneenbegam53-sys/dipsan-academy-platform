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

function twoFactorKey() {
  return String(process.env.TWOFACTOR_API_KEY || process.env.TWO_FACTOR_API_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function fast2smsKey() {
  return String(process.env.FAST2SMS_API_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

/** 2Factor.in free OTP trial (https://2factor.in). */
function smsConfigured() {
  return Boolean(twoFactorKey());
}

function otpInApp() {
  return String(process.env.OTP_DELIVERY || "sms").trim().toLowerCase() === "in_app";
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

function otpRoute() {
  const r = String(process.env.FAST2SMS_OTP_ROUTE || "otp").trim().toLowerCase();
  // Quick SMS (q) and DLT (dlt) cannot send login OTP without TRAI DLT templates.
  if (!r || r === "q" || r === "dlt" || r === "quick") return "otp";
  return r;
}

function mapTwoFactorError(data) {
  const text = String(data?.Details || data?.message || "").toLowerCase();
  if (text.includes("api key") || (text.includes("invalid") && text.includes("key"))) {
    return "2Factor API key was rejected. On Render add TWOFACTOR_API_KEY from https://2factor.in (dashboard → API key).";
  }
  if (text.includes("balance") || text.includes("credit") || text.includes("insufficient")) {
    return "2Factor free SMS credits are used up. Add more credits in 2factor.in or wait for the daily trial reset.";
  }
  if (text.includes("dlt")) {
    return "2Factor needs a DLT template for this account. In 2factor.in use the OTP SMS product (not promotional SMS).";
  }
  if (text.includes("number") || text.includes("mobile")) {
    return "That mobile number was rejected. Use a 10-digit Indian number.";
  }
  return "Could not send SMS OTP via 2Factor. Check TWOFACTOR_API_KEY on Render and free credits at 2factor.in.";
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
  const err = new Error(`SMS gateway failed (${status}): ${detail}`);
  err.userMessage = "Could not send SMS OTP. Please try again shortly.";
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

async function twoFactorSendOtp({ number, otp }) {
  const key = twoFactorKey();
  const template = String(process.env.TWOFACTOR_TEMPLATE || "").trim();
  const phones = [number, `91${number}`];
  let lastData = {};
  let lastStatus = 0;

  for (const phone of phones) {
    const parts = [encodeURIComponent(key), "SMS", encodeURIComponent(phone), encodeURIComponent(otp)];
    if (template) parts.push(encodeURIComponent(template));
    const url = `https://2factor.in/API/V1/${parts.join("/")}`;
    const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    const data = await res.json().catch(() => ({}));
    lastData = data;
    lastStatus = res.status;
    if (String(data.Status || "").toLowerCase() === "success") {
      return { ok: true, provider: "twofactor" };
    }
  }

  const err = new Error(`2Factor failed (${lastStatus}): ${lastData.Details || JSON.stringify(lastData).slice(0, 160)}`);
  err.userMessage = mapTwoFactorError(lastData);
  throw err;
}

/**
 * Notifications: in-app only. Do not spend OTP SMS credits.
 */
async function sendSms({ to, body }) {
  const number = indianMobile10(to);
  if (!number) return { ok: false, skipped: true, reason: "invalid-phone" };
  console.log(`[sms:skip] To: ${number}\n${body}`);
  return { ok: true, skipped: true };
}

/** OTP SMS via 2Factor.in (free trial). */
async function sendOtpSms({ phone, code }) {
  const number = indianMobile10(phone);
  if (!number) return { ok: false, skipped: true, reason: "invalid-phone" };

  const otp = String(code).replace(/\D/g, "");
  if (!otp) {
    const err = new Error("OTP code is empty");
    err.userMessage = "Could not create OTP. Please try again shortly.";
    throw err;
  }

  if (otpInApp()) {
    return { ok: true, inApp: true };
  }

  if (!twoFactorKey()) {
    const err = new Error("TWOFACTOR_API_KEY is not set");
    err.userMessage =
      "Add TWOFACTOR_API_KEY on Render. Create a free account at https://2factor.in → copy API key from the dashboard.";
    throw err;
  }

  return twoFactorSendOtp({ number, otp });
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
    smsProvider: sms ? "twofactor" : null,
    otpDelivery: inApp ? "in_app" : "sms",
    otpInApp: inApp,
    otpDevMode: inApp || String(process.env.OTP_DEV_MODE || "").toLowerCase() === "true",
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
