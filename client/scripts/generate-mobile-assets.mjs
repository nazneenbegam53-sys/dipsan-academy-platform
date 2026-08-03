/**
 * Generates App Store / Play Store icons + splash screens from the crest logo.
 * Run: node scripts/generate-mobile-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const logo = path.join(root, "public", "dipsan-logo.png");
const resources = path.join(root, "resources");
const iconsDir = path.join(root, "public", "icons");
const storeDir = path.join(root, "store-assets");

const INK = { r: 7, g: 18, b: 28, alpha: 1 };

async function ensureDirs() {
  for (const d of [resources, iconsDir, storeDir]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

async function squareIcon(size, out, { padding = 0.14 } = {}) {
  const inner = Math.round(size * (1 - padding * 2));
  const logoBuf = await sharp(logo)
    .resize(inner, inner, { fit: "contain", background: INK })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: INK,
    },
  })
    .composite([{ input: logoBuf, gravity: "centre" }])
    .png()
    .toFile(out);
}

async function splash(size, out) {
  const logoSize = Math.round(size * 0.38);
  const logoBuf = await sharp(logo)
    .resize(logoSize, logoSize, { fit: "contain", background: INK })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: INK,
    },
  })
    .composite([{ input: logoBuf, gravity: "centre" }])
    .png()
    .toFile(out);
}

async function main() {
  if (!fs.existsSync(logo)) {
    throw new Error(`Logo not found at ${logo}`);
  }
  await ensureDirs();

  await squareIcon(1024, path.join(resources, "icon.png"), { padding: 0.12 });
  await splash(2732, path.join(resources, "splash.png"));
  await splash(2732, path.join(resources, "splash-dark.png"));

  await squareIcon(192, path.join(iconsDir, "icon-192.png"), { padding: 0.12 });
  await squareIcon(512, path.join(iconsDir, "icon-512.png"), { padding: 0.12 });
  await squareIcon(512, path.join(iconsDir, "maskable-512.png"), { padding: 0.18 });
  await squareIcon(180, path.join(iconsDir, "apple-touch-icon.png"), { padding: 0.1 });

  await squareIcon(512, path.join(storeDir, "play-store-icon-512.png"), { padding: 0.1 });
  await squareIcon(1024, path.join(storeDir, "app-store-icon-1024.png"), { padding: 0.1 });
  await splash(1242, path.join(storeDir, "splash-preview.png"));

  console.log("✓ Generated mobile icons & splash assets in resources/, public/icons/, store-assets/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
