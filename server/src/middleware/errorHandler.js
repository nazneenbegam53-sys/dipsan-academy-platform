// Central error handler. Controllers can just `next(err)` or throw inside an
// async route wrapped with asyncHandler below, and it lands here.
function errorHandler(err, req, res, next) {
  console.error(err);
  // Multer file-size / type errors
  if (err instanceof require("multer").MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 400 : 400;
    const isVideoRoute = (req.originalUrl || "").includes("/upload/video");
    return res.status(status).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? isVideoRoute
            ? "Video is too large (max 200 MB)."
            : "Image is too large (max 5 MB)."
          : err.message,
    });
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
