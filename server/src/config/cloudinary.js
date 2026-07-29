const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKeyLoaded: !!process.env.CLOUDINARY_API_KEY,
  apiSecretLoaded: !!process.env.CLOUDINARY_API_SECRET,
});
const cloudinary = require("cloudinary").v2;

cloudinary.api.ping()
  .then((r) => console.log("Cloudinary Connected:", r))
  .catch((e) => console.error("Cloudinary Error:", e));
module.exports = cloudinary;