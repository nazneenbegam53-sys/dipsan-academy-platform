const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const {
  getPlan,
  createOrder,
  verifyPayment,
  webhook,
  listSubscribers,
  grantSubscription,
} = require("../controllers/paymentController");

const router = express.Router();

// Public webhook (Razorpay server → us). Auth is via webhook signature.
router.post("/webhook", webhook);

router.get("/plan", protect, requireRole("student", "teacher"), getPlan);
router.post("/create-order", protect, requireRole("student"), createOrder);
router.post("/verify", protect, requireRole("student"), verifyPayment);

router.get("/subscribers", protect, requireRole("teacher"), listSubscribers);
router.post("/grant", protect, requireRole("teacher"), grantSubscription);

module.exports = router;
