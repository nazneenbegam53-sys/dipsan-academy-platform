const mongoose = require("mongoose");

/**
 * One-time subscription payment records (Razorpay).
 * Amount is stored in paise (₹2000 = 200000).
 */
const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true }, // paise
    currency: { type: String, default: "INR" },
    purpose: {
      type: String,
      enum: ["full_access_subscription"],
      default: "full_access_subscription",
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
      index: true,
    },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, sparse: true },
    razorpaySignature: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
