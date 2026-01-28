const mongoose = require("mongoose");

const URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    // Connection pooling and optimization for production
    await mongoose.connect(URI, {
      maxPoolSize: 10, // Reuse connections (critical for performance)
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000, // Fail fast on connection issues
      socketTimeoutMS: 45000,
    });
    console.log("✅ Database connected successfully");

    // Handle connection errors after initial connection
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    // Don't exit process - let error handling middleware catch it
    throw error;
  }
};

module.exports = connectDB;
