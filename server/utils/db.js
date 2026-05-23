const mongoose = require("mongoose");

const URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    // Connection pooling and optimization for production
    await mongoose.connect(URI, {
      maxPoolSize: 10, // Reuse connections (critical for performance)
      minPoolSize: 2,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000, // Allow cold starts / slow DNS resolution
      socketTimeoutMS: 60000,
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

    // Retry a few times before giving up so the app can survive temporary cold starts.
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const delayMs = attempt * 5000;
      console.warn(
        `⚠️ Retrying MongoDB connection in ${delayMs / 1000}s (attempt ${attempt}/3)...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      try {
        await mongoose.connect(URI, {
          maxPoolSize: 10,
          minPoolSize: 2,
          connectTimeoutMS: 30000,
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 60000,
        });
        console.log("✅ Database connected successfully after retry");
        return;
      } catch (retryError) {
        console.error(`❌ Retry ${attempt} failed:`, retryError.message);
        if (attempt === 3) {
          throw retryError;
        }
      }
    }
  }
};

module.exports = connectDB;
