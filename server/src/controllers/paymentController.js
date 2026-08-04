const crypto = require("crypto");
const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  SUBSCRIPTION_AMOUNT_INR,
  SUBSCRIPTION_AMOUNT_PAISE,
  SUBSCRIPTION_CURRENCY,
  SUBSCRIPTION_LABEL,
  SUBSCRIPTION_DESCRIPTION,
  hasActiveSubscription,
} = require("../config/subscription");

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return null;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expected === signature;
}

const getPlan = asyncHandler(async (req, res) => {
  const subscribed = hasActiveSubscription(req.user);
  res.json({
    plan: {
      amountInr: SUBSCRIPTION_AMOUNT_INR,
      amountPaise: SUBSCRIPTION_AMOUNT_PAISE,
      currency: SUBSCRIPTION_CURRENCY,
      label: SUBSCRIPTION_LABEL,
      description: SUBSCRIPTION_DESCRIPTION,
      benefits: [
        "Access to all published mock tests",
        "Detailed text, image, and video solutions",
        "Unlimited practice attempts on unlocked papers",
      ],
    },
    subscribed,
    subscription: {
      active: Boolean(req.user.subscriptionActive),
      paidAt: req.user.subscriptionPaidAt || null,
      amountInr: req.user.subscriptionAmountInr || null,
    },
    razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    keyId: process.env.RAZORPAY_KEY_ID || null,
  });
});

const createOrder = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only students need a subscription." });
  }
  if (hasActiveSubscription(req.user)) {
    return res.status(400).json({ message: "You already have full access." });
  }

  const razorpay = getRazorpayClient();
  if (!razorpay) {
    return res.status(503).json({
      message:
        "Payment gateway is not configured yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.",
    });
  }

  const order = await razorpay.orders.create({
    amount: SUBSCRIPTION_AMOUNT_PAISE,
    currency: SUBSCRIPTION_CURRENCY,
    receipt: `sub_${req.user._id.toString().slice(-8)}_${Date.now()}`,
    notes: {
      userId: req.user._id.toString(),
      purpose: "full_access_subscription",
      email: req.user.email,
    },
  });

  await Payment.create({
    user: req.user._id,
    amount: SUBSCRIPTION_AMOUNT_PAISE,
    currency: SUBSCRIPTION_CURRENCY,
    purpose: "full_access_subscription",
    status: "created",
    razorpayOrderId: order.id,
  });

  res.status(201).json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    label: SUBSCRIPTION_LABEL,
    description: SUBSCRIPTION_DESCRIPTION,
    prefill: {
      name: req.user.name,
      email: req.user.email,
      contact: req.user.phone || "",
    },
  });
});

async function activateSubscription(userId, paymentDoc, paymentId, signature) {
  paymentDoc.status = "paid";
  paymentDoc.razorpayPaymentId = paymentId;
  paymentDoc.razorpaySignature = signature;
  paymentDoc.paidAt = new Date();
  await paymentDoc.save();

  const user = await User.findById(userId);
  if (!user) return null;

  user.subscriptionActive = true;
  user.subscriptionPaidAt = paymentDoc.paidAt;
  user.subscriptionAmountInr = SUBSCRIPTION_AMOUNT_INR;
  user.subscriptionPaymentId = paymentId;
  user.subscriptionOrderId = paymentDoc.razorpayOrderId;
  await user.save();
  return user;
}

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing Razorpay payment fields." });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ message: "Payment gateway is not configured." });
  }

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(400).json({ message: "Invalid payment signature." });
  }

  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id,
    user: req.user._id,
  });
  if (!payment) {
    return res.status(404).json({ message: "Payment order not found." });
  }

  if (payment.status === "paid") {
    return res.json({
      message: "Subscription already active.",
      user: req.user.toSafeObject(),
    });
  }

  const user = await activateSubscription(
    req.user._id,
    payment,
    razorpay_payment_id,
    razorpay_signature
  );

  res.json({
    message: "Payment successful. Full access unlocked.",
    user: user.toSafeObject(),
  });
});

/**
 * Optional Razorpay webhook (payment.captured) for server-side confirmation.
 * Configure webhook secret as RAZORPAY_WEBHOOK_SECRET.
 */
const webhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (signature !== expected) {
      return res.status(400).json({ message: "Invalid webhook signature." });
    }
  }

  const event = req.body?.event;
  const entity = req.body?.payload?.payment?.entity;
  if (event === "payment.captured" && entity) {
    const orderId = entity.order_id;
    const paymentId = entity.id;
    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (payment && payment.status !== "paid") {
      await activateSubscription(payment.user, payment, paymentId, "webhook");
    }
  }

  res.json({ received: true });
});

module.exports = { getPlan, createOrder, verifyPayment, webhook };
