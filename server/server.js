require("dotenv").config();
require("./models/tags-model");
require("./models/trade-model");
const express = require("express");
const validateEnv = require("./utils/validateEnv");
const connectDB = require("./utils/db");

// Validate environment variables before starting
validateEnv();

const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRoute = require("./routers/Auth-router");
const tradeRoute = require("./routers/Trade-router");
const notesRoute = require("./routers/Notes-router");
const userRoute = require("./routers/User-router");
const contactRoute = require("./routers/Contact-router");
const accountRoute = require("./routers/Account-router");
const adminRoute = require("./routers/Admin-router");
const paymentRoute = require("./routers/Payment-router");
const exportRoute = require("./routers/Export-router");
const tagsRoute = require("./routers/Tags-router");
const strategyRoute = require("./routers/Strategy-router");
const errorMiddleware = require("./middleware/error-middleware");

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // For Cloudinary images
  }),
);

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login/register attempts per 15 minutes
  message: "Too many authentication attempts, please try again later",
});

//cors
const corsOptions = {
  origin: ["http://localhost:5173", "https://trading-journal-saas.netlify.app"],
  methods: "GET, POST, PATCH, DELETE, PUT, HEAD",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" })); // Limit payload size

// Health check endpoint for monitoring and preventing cold starts
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api/auth/", authLimiter, authRoute);
app.use("/api/trades", tradeRoute);
app.use("/api/user", userRoute);
app.use("/api/notes", notesRoute);
app.use("/api/contact", contactRoute);
app.use("/api/account", accountRoute);
app.use("/api/admin", adminRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/export", exportRoute);
app.use("/api/tags", tagsRoute);
app.use("/api/strategy", strategyRoute);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

// Global error handlers to prevent crashes
process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION! Shutting down gracefully...");
  console.error(error.name, error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED REJECTION! Shutting down gracefully...");
  console.error("Reason:", reason);
  // In production, you might want to just log and continue instead of exiting
  if (process.env.NODE_ENV === "production") {
    console.error("Continuing in production mode...");
  } else {
    process.exit(1);
  }
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  });
