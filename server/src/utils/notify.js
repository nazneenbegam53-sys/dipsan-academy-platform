const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendChannels } = require("./messaging");

const CLIENT_ORIGIN = () =>
  (process.env.CLIENT_ORIGIN || "https://dipsan-academy-platform.vercel.app")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");

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

async function deliverExternal(user, { title, message, link = "" }) {
  if (!user) return;
  const origin = CLIENT_ORIGIN();
  const absolute = link ? (link.startsWith("http") ? link : `${origin}${link}`) : origin;
  const text = `${title}\n\n${message}${link ? `\n\nOpen: ${absolute}` : ""}\n\n— Dipsan Academy`;
  await sendChannels({
    email: user.email,
    phone: user.phone,
    subject: `Dipsan Academy — ${title}`,
    text,
    html: `<p><strong>${title}</strong></p><p>${message}</p>${
      link ? `<p><a href="${absolute}">Open in Dipsan Academy</a></p>` : ""
    }<p>— Dipsan Academy</p>`,
  });
}

async function notifyStudents(payload) {
  const students = await User.find({ role: "student" }).select("_id email phone name");
  await Promise.all(
    students.map(async (s) => {
      await createNotification({
        userId: s._id,
        ...payload,
      });
      await deliverExternal(s, payload);
    })
  );
}

async function notifyUser(userId, payload) {
  const note = await createNotification({ userId, ...payload });
  try {
    const user = await User.findById(userId).select("email phone name");
    await deliverExternal(user, payload);
  } catch (err) {
    console.error("[notify] external delivery failed:", err.message);
  }
  return note;
}

/**
 * Email + WhatsApp a concise exam result to the student.
 */
async function sendResultChannels(user, { examTitle, subject, score, total, percentage, link }) {
  if (!user) return;
  const origin = CLIENT_ORIGIN();
  const absolute = link ? (link.startsWith("http") ? link : `${origin}${link}`) : origin;
  const title = "Your exam result";
  const message = [
    `Hi ${user.name || "student"},`,
    "",
    `Result for ${subject || "Exam"} — ${examTitle || "Mock test"}:`,
    `Score: ${score}/${total} (${percentage}%)`,
    "",
    `View full solutions: ${absolute}`,
  ].join("\n");

  await sendChannels({
    email: user.email,
    phone: user.phone,
    subject: `Dipsan Academy result — ${examTitle || subject || "Exam"}`,
    text: `${message}\n\n— Dipsan Academy`,
    html: `<p>Hi ${user.name || "student"},</p>
      <p>Result for <strong>${subject || "Exam"} — ${examTitle || "Mock test"}</strong>:</p>
      <p style="font-size:18px"><strong>${score}/${total}</strong> (${percentage}%)</p>
      <p><a href="${absolute}">View full result &amp; video solutions</a></p>
      <p>— Dipsan Academy</p>`,
  });
}

module.exports = {
  createNotification,
  notifyStudents,
  notifyUser,
  sendResultChannels,
  deliverExternal,
};
