const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

let ffmpegPath = null;
try {
  ffmpegPath = require("ffmpeg-static");
} catch {
  ffmpegPath = null;
}

function isLikelyWebm(mime, filename = "") {
  const m = (mime || "").toLowerCase();
  const name = (filename || "").toLowerCase();
  return (
    m.includes("webm") ||
    m.includes("matroska") ||
    name.endsWith(".webm") ||
    name.endsWith(".mkv")
  );
}

function isLikelyMp4(mime, filename = "") {
  const m = (mime || "").toLowerCase();
  const name = (filename || "").toLowerCase();
  return (
    m.includes("mp4") ||
    m.includes("quicktime") ||
    name.endsWith(".mp4") ||
    name.endsWith(".m4v") ||
    name.endsWith(".mov")
  );
}

/**
 * Convert WebM/MKV (and other non-MP4) buffers to H.264/AAC MP4 for iOS / mobile.
 * Returns null when ffmpeg is unavailable or conversion fails.
 */
async function transcodeBufferToMp4(inputBuffer, { inputExt = ".webm" } = {}) {
  if (!ffmpegPath || !inputBuffer?.length) return null;

  const stamp = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const inFile = path.join(os.tmpdir(), `dipsan-${stamp}${inputExt}`);
  const outFile = path.join(os.tmpdir(), `dipsan-${stamp}.mp4`);

  await fs.promises.writeFile(inFile, inputBuffer);

  try {
    await new Promise((resolve, reject) => {
      const args = [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        inFile,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-preset",
        "veryfast",
        "-crf",
        "28",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-ac",
        "1",
        "-movflags",
        "+faststart",
        outFile,
      ];
      const child = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
      let err = "";
      child.stderr.on("data", (chunk) => {
        err += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(err.trim() || `ffmpeg exited with code ${code}`));
      });
    });

    const out = await fs.promises.readFile(outFile);
    if (!out.length) return null;
    return out;
  } finally {
    await Promise.all([
      fs.promises.unlink(inFile).catch(() => undefined),
      fs.promises.unlink(outFile).catch(() => undefined),
    ]);
  }
}

module.exports = {
  ffmpegPath,
  isLikelyWebm,
  isLikelyMp4,
  transcodeBufferToMp4,
};
