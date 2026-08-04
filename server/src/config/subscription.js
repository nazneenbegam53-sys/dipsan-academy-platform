/**
 * Subscription pricing — one-time unlock for all mock tests + solutions.
 * Razorpay expects amount in the smallest currency unit (paise for INR).
 */
const SUBSCRIPTION_AMOUNT_INR = 2000;
const SUBSCRIPTION_AMOUNT_PAISE = SUBSCRIPTION_AMOUNT_INR * 100;
const SUBSCRIPTION_CURRENCY = "INR";
const SUBSCRIPTION_LABEL = "Dipsan Academy Full Access";
const SUBSCRIPTION_DESCRIPTION =
  "Unlock all mock tests and detailed solutions for NEET & JEE practice.";

function hasActiveSubscription(user) {
  if (!user) return false;
  if (user.role === "teacher") return true;
  return Boolean(user.subscriptionActive);
}

module.exports = {
  SUBSCRIPTION_AMOUNT_INR,
  SUBSCRIPTION_AMOUNT_PAISE,
  SUBSCRIPTION_CURRENCY,
  SUBSCRIPTION_LABEL,
  SUBSCRIPTION_DESCRIPTION,
  hasActiveSubscription,
};
