const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Unique only when a real email string is present. A unique+sparse index still
    // indexes { email: null }, so the second OTP teacher/student hit E11000.
    email: { type: String, lowercase: true, trim: true },
    // Optional when the account is OTP-only; kept for legacy password users.
    password: { type: String, minlength: 6, required: false, select: false },
    role: { type: String, enum: ["student", "teacher"], required: true },

    className: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    phone: { type: String, trim: true },

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

userSchema.index(
  { email: 1 },
  {
    unique: true,
    name: "email_unique_partial",
    partialFilterExpression: { email: { $exists: true, $type: "string" } },
  }
);
userSchema.index(
  { phone: 1 },
  {
    unique: true,
    name: "phone_unique_partial",
    partialFilterExpression: { phone: { $exists: true, $type: "string" } },
  }
);

function unsetBlankContactFields() {
  if (this.email == null || this.email === "") {
    this.set("email", undefined);
  }
  if (this.phone == null || this.phone === "") {
    this.set("phone", undefined);
  }
}

userSchema.pre("validate", function (next) {
  unsetBlankContactFields.call(this);
  next();
});

userSchema.pre("save", async function (next) {
  unsetBlankContactFields.call(this);
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
    // Every account must have a verified mobile for OTP login.
    needsPhone: !this.phone,
    subscriptionActive: Boolean(this.subscriptionActive),
    subscriptionPaidAt: this.subscriptionPaidAt || null,
    subscriptionAmountInr: this.subscriptionAmountInr || null,
  };
};

module.exports = mongoose.model("User", userSchema);
