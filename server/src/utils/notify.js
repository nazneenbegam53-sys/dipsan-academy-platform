const Notification = require("../models/Notification");
const User = require("../models/User");

async function createNotification({ userId, type, title, message, link = "", meta = {} }) {
  if (!userId) return null;
  try {
    return await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      meta,
    });
  } catch (err) {
    console.error("[notify] failed to create notification", err.message);
    return null;
  }
}

async function notifyStudents(payload) {
  const students = await User.find({ role: "student" }).select("_id");
  await Promise.all(
    students.map((s) =>
      createNotification({
        userId: s._id,
        ...payload,
      })
    )
  );
}

async function notifyUser(userId, payload) {
  return createNotification({ userId, ...payload });
}

module.exports = { createNotification, notifyStudents, notifyUser };
