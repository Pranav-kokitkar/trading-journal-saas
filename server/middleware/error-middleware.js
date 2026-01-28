const errorMiddleware = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const extraDetails = err.extraDetails || "An unexpected error occurred";

  // Log error for debugging (production should use proper logging service)
  if (status === 500) {
    console.error("❌ Server Error:", {
      message: err.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Don't leak error details in production
  const responseMessage =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : message;

  return res.status(status).json({
    message: responseMessage,
    extraDetails:
      status === 500 && process.env.NODE_ENV === "production"
        ? "Please contact support"
        : extraDetails,
  });
};

module.exports = errorMiddleware;
