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

function whatsappConfigured() {
  // Twilio WhatsApp
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) {
    return "twilio";
  }
  // Meta WhatsApp Cloud API
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return "meta";
  }
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

async function sendWhatsAppTwilio(toE164, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886
  const to = toE164.startsWith("whatsapp:") ? toE164 : `whatsapp:${toE164}`;
  const fromAddr = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ From: fromAddr, To: to, Body: body });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio WhatsApp failed (${res.status}): ${errText.slice(0, 300)}`);
  }
  return { ok: true, provider: "twilio" };
}

async function sendWhatsAppMeta(toE164, body) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const digits = toE164.replace(/\D/g, "");
  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: digits,
      type: "text",
      text: { body },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Meta WhatsApp failed (${res.status}): ${errText.slice(0, 300)}`);
  }
  return { ok: true, provider: "meta" };
}

async function sendWhatsApp({ to, body }) {
  const e164 = normalizePhone(to);
  if (!e164) return { ok: false, skipped: true, reason: "invalid-phone" };

  const provider = whatsappConfigured();
  if (!provider) {
    console.log(`[whatsapp:dev] To: ${e164}\n${body}`);
    return { ok: true, dev: true };
  }

  if (provider === "twilio") return sendWhatsAppTwilio(e164, body);
  return sendWhatsAppMeta(e164, body);
}

/**
 * Send the same message on email + WhatsApp (best-effort; never throws to callers).
 */
async function sendChannels({ email, phone, subject, text, html }) {
  const results = { email: null, whatsapp: null };
  if (email) {
    try {
      results.email = await sendEmail({ to: email, subject, text, html });
    } catch (err) {
      console.error("[email] send failed:", err.message);
      results.email = { ok: false, error: err.message };
    }
  }
  if (phone) {
    try {
      results.whatsapp = await sendWhatsApp({ to: phone, body: text });
    } catch (err) {
      console.error("[whatsapp] send failed:", err.message);
      results.whatsapp = { ok: false, error: err.message };
    }
  }
  return results;
}

function messagingStatus() {
  return {
    email: emailConfigured(),
    whatsapp: Boolean(whatsappConfigured()),
    whatsappProvider: whatsappConfigured(),
    otpDevMode:
      String(process.env.OTP_DEV_MODE || "").toLowerCase() === "true" ||
      (!emailConfigured() && !whatsappConfigured()),
  };
}

module.exports = {
  sendEmail,
  sendWhatsApp,
  sendChannels,
  emailConfigured,
  whatsappConfigured,
  messagingStatus,
};
