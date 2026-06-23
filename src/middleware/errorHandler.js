/**
 * 404 — Not Found handler
 * Catches any request that didn't match a route.
 */
export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    error: {
      status: 404,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

/**
 * Global error handler middleware.
 * Must have 4 parameters for Express to recognise it as an error handler.
 */
export function errorHandler(err, _req, res, _next) {
  console.error('❌ Server Error:', err);

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: {
      status: statusCode,
      message: err.message || 'Internal server error.',
    },
  });
}
