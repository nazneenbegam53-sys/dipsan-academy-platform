const Notification = require("../models/Notification");
const { asyncHandler } = require("../middleware/errorHandler");

const listMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(40);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ notifications, unreadCount });
});

const markRead = asyncHandler(async (req, res) => {
  const note = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!note) return res.status(404).json({ message: "Notification not found." });
  res.json({ notification: note });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
});

module.exports = { listMyNotifications, markRead, markAllRead };
