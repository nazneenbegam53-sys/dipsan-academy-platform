const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendNotificationSms, sendResultEmail, otpInApp } = require("./messaging");

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

/** Notifications → SMS text (not email / WhatsApp). */
async function deliverSmsNotification(user, { title, message }) {
  if (!user?.phone) return;
  if (otpInApp()) return;
  try {
    await sendNotificationSms({ phone: user.phone, title, message });
  } catch (err) {
    console.error("[notify-sms] failed:", err.message);
  }
}

async function notifyStudents(payload) {
  const students = await User.find({ role: "student" }).select("_id email phone name");
  await Promise.all(
    students.map(async (s) => {
      await createNotification({
        userId: s._id,
        ...payload,
      });
      await deliverSmsNotification(s, payload);
    })
  );
}

async function notifyUser(userId, payload) {
  const note = await createNotification({ userId, ...payload });
  try {
    const user = await User.findById(userId).select("email phone name");
    await deliverSmsNotification(user, payload);
  } catch (err) {
    console.error("[notify] external delivery failed:", err.message);
  }
  return note;
}

/** Exam results → email only. */
async function sendResultChannels(user, { examTitle, subject, score, total, percentage, link }) {
  if (!user?.email) return;
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

  try {
    await sendResultEmail({
      email: user.email,
      subject: `Dipsan Academy result — ${examTitle || subject || "Exam"}`,
      text: `${message}\n\n— Dipsan Academy`,
      html: `<p>Hi ${user.name || "student"},</p>
        <p>Result for <strong>${subject || "Exam"} — ${examTitle || "Mock test"}</strong>:</p>
        <p style="font-size:18px"><strong>${score}/${total}</strong> (${percentage}%)</p>
        <p><a href="${absolute}">View full result &amp; video solutions</a></p>
        <p>— Dipsan Academy</p>`,
    });
  } catch (err) {
    console.error("[result-email] failed:", err.message);
  }
}

module.exports = {
  createNotification,
  notifyStudents,
  notifyUser,
  sendResultChannels,
};
