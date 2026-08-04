const { hasActiveSubscription } = require("../config/subscription");

/**
 * Students must have an active paid subscription to start exams or view solutions.
 * Teachers always pass.
 */
function requireSubscription(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated." });
  }
  if (hasActiveSubscription(req.user)) {
    return next();
  }
  return res.status(402).json({
    message: "A ₹2000 subscription is required to access mock tests and solutions.",
    code: "SUBSCRIPTION_REQUIRED",
    subscribePath: "/subscribe",
  });
}

module.exports = { requireSubscription };
