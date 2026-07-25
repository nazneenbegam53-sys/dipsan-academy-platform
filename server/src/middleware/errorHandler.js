// Central error handler. Controllers can just `next(err)` or throw inside an
// async route wrapped with asyncHandler below, and it lands here.
function errorHandler(err, req, res, next) {
  console.error(err);
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
