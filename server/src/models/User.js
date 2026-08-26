const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Optional when the account is OTP-only; kept for legacy password users.
    password: { type: String, minlength: 6, required: false, select: false },
    role: { type: String, enum: ["student", "teacher"], required: true },

    className: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    // Required for new OTP signups; sparse unique so legacy users without phone still work.
    phone: { type: String, trim: true, sparse: true, unique: true },

    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },

    subscriptionActive: { type: Boolean, default: false },
    subscriptionPaidAt: { type: Date },
    subscriptionAmountInr: { type: Number },
    subscriptionPaymentId: { type: String },
    subscriptionOrderId: { type: String },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    className: this.className,
    rollNumber: this.rollNumber,
    phone: this.phone,
    emailVerified: Boolean(this.emailVerified),
    phoneVerified: Boolean(this.phoneVerified),
    // Every account must have a verified mobile for WhatsApp OTP / results.
    needsPhone: !this.phone,
    subscriptionActive: Boolean(this.subscriptionActive),
    subscriptionPaidAt: this.subscriptionPaidAt || null,
    subscriptionAmountInr: this.subscriptionAmountInr || null,
  };
};

module.exports = mongoose.model("User", userSchema);
