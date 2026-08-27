// Central error handler. Controllers can just `next(err)` or throw inside an
// async route wrapped with asyncHandler below, and it lands here.
function errorHandler(err, req, res, next) {
  console.error(err);
  // Multer file-size / type errors
  if (err instanceof require("multer").MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 400 : 400;
    return res.status(status).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? (req.originalUrl || "").includes("/upload/video")
            ? "Video is too large (max 200 MB)."
            : (req.originalUrl || "").includes("/upload/pdf")
              ? "PDF is too large (max 25 MB)."
              : "Image is too large (max 5 MB)."
          : err.message,
    });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "value";
    const friendly =
      field === "email"
        ? "An account with this email already exists."
        : field === "phone"
          ? "An account with this mobile number already exists. Please log in."
          : "This account already exists.";
    return res.status(409).json({ message: friendly });
  }
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Something went wrong on the server.",
  });
}

// Wraps an async route handler so thrown errors/rejected promises reach errorHandler
// instead of crashing the process.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };
