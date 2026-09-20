const Classroom = require("../models/Classroom");
const { asyncHandler } = require("../middleware/errorHandler");

function generateJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function uniqueJoinCode() {
  for (let attempt = 0; attempt < 12; attempt++) {
    const joinCode = generateJoinCode();
    const exists = await Classroom.exists({ joinCode });
    if (!exists) return joinCode;
  }
  throw Object.assign(new Error("Could not generate a join code."), { statusCode: 500 });
}

function isMember(classroom, userId) {
  const id = String(userId);
  if (String(classroom.teacher) === id || String(classroom.teacher?._id) === id) return true;
  return (classroom.members || []).some((m) => String(m.user?._id || m.user) === id);
}

function toClassroom(doc) {
  const c = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: c._id,
    name: c.name,
    teacher: c.teacher,
    joinCode: c.joinCode,
    members: c.members || [],
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

const createClassroom = asyncHandler(async (req, res) => {
  const name = (req.body.name || "DIPSAN ACADEMY CLASSROOM").trim() || "DIPSAN ACADEMY CLASSROOM";
  const joinCode = await uniqueJoinCode();
  const classroom = await Classroom.create({
    name,
    teacher: req.user._id,
    joinCode,
    members: [{ user: req.user._id, role: "teacher" }],
  });
  const populated = await Classroom.findById(classroom._id)
    .populate("teacher", "name role")
    .populate("members.user", "name role");
  res.status(201).json({ classroom: toClassroom(populated) });
});

const listClassrooms = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const classrooms = await Classroom.find({
    $or: [{ teacher: uid }, { "members.user": uid }],
  })
    .populate("teacher", "name role")
    .populate("members.user", "name role")
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ classrooms: classrooms.map(toClassroom) });
});

const getClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.id)
    .populate("teacher", "name role")
    .populate("members.user", "name role");
  if (!classroom) return res.status(404).json({ message: "Classroom not found." });
  if (!isMember(classroom, req.user._id)) {
    return res.status(403).json({ message: "You are not a member of this classroom." });
  }
  res.json({ classroom: toClassroom(classroom) });
});

const joinClassroom = asyncHandler(async (req, res) => {
  const joinCode = String(req.body.joinCode || "")
    .trim()
    .toUpperCase();
  if (!joinCode || joinCode.length !== 6) {
    return res.status(400).json({ message: "Enter a valid 6-character join code." });
  }

  const classroom = await Classroom.findOne({ joinCode });
  if (!classroom) return res.status(404).json({ message: "No classroom found for that code." });

  if (isMember(classroom, req.user._id)) {
    const populated = await Classroom.findById(classroom._id)
      .populate("teacher", "name role")
      .populate("members.user", "name role");
    return res.json({ classroom: toClassroom(populated), alreadyMember: true });
  }

  const role = req.user.role === "teacher" ? "teacher" : "student";
  classroom.members.push({ user: req.user._id, role });
  await classroom.save();

  const populated = await Classroom.findById(classroom._id)
    .populate("teacher", "name role")
    .populate("members.user", "name role");
  res.json({ classroom: toClassroom(populated) });
});

module.exports = {
  createClassroom,
  listClassrooms,
  getClassroom,
  joinClassroom,
  isMember,
};
