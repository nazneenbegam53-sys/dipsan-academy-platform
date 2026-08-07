const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["student", "teacher"], required: true },

    // Student-only fields (spec section 3 "Student Details")
    className: { type: String, trim: true }, // e.g. "12th", "Dropper Batch"
    rollNumber: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
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
  };
};

module.exports = mongoose.model("User", userSchema);
