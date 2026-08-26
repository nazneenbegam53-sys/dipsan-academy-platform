const mongoose = require("mongoose");

/**
 * Phone-only accounts have no email. Mongo unique indexes still treat { email: null } as
 * a real key, so a second teacher signup failed with E11000 on email_1.
 * Unset blank emails/phones and replace unique+sparse indexes with partial ones.
 */
async function repairUserContactIndexes() {
  const User = require("../models/User");
  const coll = User.collection;

  await coll.updateMany(
    { $or: [{ email: null }, { email: "" }] },
    { $unset: { email: "" } }
  );
  await coll.updateMany(
    { $or: [{ phone: null }, { phone: "" }] },
    { $unset: { phone: "" } }
  );

  const indexes = await coll.indexes();
  for (const idx of indexes) {
    if (idx.name === "_id_") continue;
    const keys = Object.keys(idx.key || {});
    const isLegacyUniqueContact =
      (idx.name === "email_1" || idx.name === "phone_1") &&
      keys.length === 1 &&
      (keys[0] === "email" || keys[0] === "phone");
    if (isLegacyUniqueContact) {
      try {
        await coll.dropIndex(idx.name);
        console.log(`Dropped legacy users index ${idx.name}`);
      } catch (err) {
        if (err.code !== 27) throw err;
      }
    }
  }

  await User.syncIndexes();
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set — check your .env file.");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
  try {
    await repairUserContactIndexes();
  } catch (err) {
    console.error("User index repair failed:", err.message);
  }
}

module.exports = connectDB;
