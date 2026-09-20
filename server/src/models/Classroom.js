const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["student", "teacher"], required: true },
  },
  { _id: false }
);

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "DIPSAN ACADEMY CLASSROOM",
    },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    members: [memberSchema],
  },
  { timestamps: true }
);

classroomSchema.index({ teacher: 1 });
classroomSchema.index({ "members.user": 1 });

module.exports = mongoose.model("Classroom", classroomSchema);
