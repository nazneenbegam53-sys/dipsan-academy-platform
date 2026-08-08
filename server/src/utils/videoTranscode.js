const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { pipeline } = require("stream/promises");

let ffmpegPath = null;
try {
  ffmpegPath = require("ffmpeg-static");
} catch {
  ffmpegPath = null;
}

/** Free Render instances (~512MB): only one ffmpeg at a time. */
let transcodeQueue = Promise.resolve();

function enqueueTranscode(task) {
  const run = transcodeQueue.then(task, task);
  // Keep the queue alive even if a job fails.
  transcodeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
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

function tempPair(inputExt = ".webm") {
  const stamp = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return {
    inFile: path.join(os.tmpdir(), `dipsan-${stamp}${inputExt}`),
    outFile: path.join(os.tmpdir(), `dipsan-${stamp}.mp4`),
  };
}

async function unlinkQuiet(...files) {
  await Promise.all(files.map((f) => fs.promises.unlink(f).catch(() => undefined)));
}

/**
 * Low-memory H.264 convert: files on disk only, single-threaded ffmpeg.
 * Caps resolution at 720p so Render free tier does not OOM.
 */
function runFfmpegToMp4(inFile, outFile) {
  if (!ffmpegPath) {
    return Promise.reject(new Error("ffmpeg binary is not available."));
  }

  return new Promise((resolve, reject) => {
    const args = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-threads",
      "1",
      "-filter_threads",
      "1",
      "-i",
      inFile,
      // Even dimensions + downscale — libx264 + free-tier RAM safe.
      "-vf",
      "scale='min(720,iw)':-2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "ultrafast",
      "-crf",
      "30",
      "-maxrate",
      "900k",
      "-bufsize",
      "1800k",
      "-c:a",
      "aac",
      "-b:a",
      "64k",
      "-ac",
      "1",
      "-ar",
      "44100",
      "-movflags",
      "+faststart",
      outFile,
    ];

    const child = spawn(ffmpegPath, args, {
      stdio: ["ignore", "ignore", "pipe"],
      env: { ...process.env, OMP_NUM_THREADS: "1" },
    });

    let err = "";
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
      if (err.length > 4000) err = err.slice(-2000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.trim() || `ffmpeg exited with code ${code}`));
    });
  });
}

/**
 * Convert an on-disk input file to an on-disk MP4 (queued, low memory).
 */
async function transcodeFileToMp4(inFile, outFile) {
  return enqueueTranscode(() => runFfmpegToMp4(inFile, outFile));
}

/**
 * Convert a Buffer → MP4 Buffer only for small uploads.
 * Prefer transcodeFileToMp4 + GridFS streaming for anything large.
 */
async function transcodeBufferToMp4(inputBuffer, { inputExt = ".webm" } = {}) {
  if (!ffmpegPath || !inputBuffer?.length) return null;

  const { inFile, outFile } = tempPair(inputExt);
  try {
    await fs.promises.writeFile(inFile, inputBuffer);
    await transcodeFileToMp4(inFile, outFile);
    return await fs.promises.readFile(outFile);
  } finally {
    await unlinkQuiet(inFile, outFile);
  }
}

/**
 * Write a readable stream to a temp file (does not buffer the whole video in RAM).
 */
async function streamToTempFile(readable, inputExt = ".webm") {
  const { inFile, outFile } = tempPair(inputExt);
  await pipeline(readable, fs.createWriteStream(inFile));
  return { inFile, outFile };
}

module.exports = {
  ffmpegPath,
  isLikelyWebm,
  isLikelyMp4,
  transcodeBufferToMp4,
  transcodeFileToMp4,
  streamToTempFile,
  tempPair,
  unlinkQuiet,
  enqueueTranscode,
  /** Soft caps tuned for ~512MB Render instances */
  MAX_UPLOAD_TRANSCODE_BYTES: 12 * 1024 * 1024,
  MAX_LAZY_TRANSCODE_BYTES: 28 * 1024 * 1024,
};
