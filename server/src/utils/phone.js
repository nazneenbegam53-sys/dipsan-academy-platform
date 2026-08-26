/** Normalize Indian / international phone numbers to E.164 (+91…). */
function normalizePhone(raw) {
  if (!raw || typeof raw !== "string") return null;
  let digits = raw.replace(/[^\d+]/g, "").trim();
  if (!digits) return null;

  if (digits.startsWith("+")) {
    const rest = digits.slice(1).replace(/\D/g, "");
    if (rest.length < 10 || rest.length > 15) return null;
    return `+${rest}`;
  }

  digits = digits.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

module.exports = { normalizePhone, isValidEmail };
