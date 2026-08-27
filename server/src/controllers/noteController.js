const Note = require("../models/Note");
const { asyncHandler } = require("../middleware/errorHandler");
const { deleteStoredFile } = require("../utils/mediaStorage");
const { notifyStudents } = require("../utils/notify");

function toNote(doc) {
  const n = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: n._id,
    title: n.title,
    subject: n.subject || "",
    fileUrl: n.fileUrl,
    provider: n.provider,
    originalName: n.originalName || "",
    size: n.size || 0,
    uploadedBy: n.uploadedBy,
    createdAt: n.createdAt,
  };
}

const listNotes = asyncHandler(async (_req, res) => {
  const notes = await Note.find({})
    .populate("uploadedBy", "name")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    notes: notes.map((n) => ({
      ...toNote(n),
      teacherName: n.uploadedBy?.name || "Teacher",
    })),
  });
});

const createNote = asyncHandler(async (req, res) => {
  const title = (req.body.title || "").trim();
  const fileUrl = (req.body.fileUrl || req.body.url || "").trim();
  if (!title) return res.status(400).json({ message: "Give the notes a title." });
  if (!fileUrl) return res.status(400).json({ message: "Upload a PDF first." });

  const note = await Note.create({
    title,
    subject: (req.body.subject || "").trim(),
    fileUrl,
    provider: req.body.provider === "cloudinary" ? "cloudinary" : "gridfs",
    originalName: req.body.originalName || "",
    mimeType: req.body.mimeType || "application/pdf",
    size: Number(req.body.size) || 0,
    uploadedBy: req.user._id,
  });

  notifyStudents({
    type: "note-published",
    title: "New notes uploaded",
    message: `${req.user.name || "A teacher"} shared “${note.title}”.`,
    link: "/student/notes",
    meta: { noteId: note._id },
  }).catch((err) => console.error("[notes] notify failed:", err.message));

  res.status(201).json({ note: toNote(note) });
});

const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: "Notes not found." });
  if (String(note.uploadedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only delete notes you uploaded." });
  }

  await deleteStoredFile(note.fileUrl);
  await note.deleteOne();
  res.json({ ok: true });
});

module.exports = { listNotes, createNote, deleteNote };
