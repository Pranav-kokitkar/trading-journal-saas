/**
 * Validates required environment variables on startup
 * Fails fast if critical config is missing
 */

const requiredEnvVars = ["MONGO_URI"];

const hasJwtSecret =
  Boolean(process.env.JWT_SECRET_KEY) || Boolean(process.env.JWT_SECRETE_KEY);

const validateEnv = () => {
  const missing = [];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (!hasJwtSecret) {
    missing.push("JWT_SECRET_KEY or JWT_SECRETE_KEY");
  }

  if (!process.env.PORT) {
    console.warn(
      "⚠️ PORT is not set. The server will use the default runtime port from server.js.",
    );
  }

  if (missing.length > 0) {
    console.error("❌ CRITICAL ERROR: Missing required environment variables:");
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error("\nPlease check your .env file and try again.");
    process.exit(1);
  }

  // Validate MongoDB URI format
  if (!process.env.MONGO_URI.startsWith("mongodb")) {
    console.error(
      "❌ CRITICAL ERROR: MONGO_URI must be a valid MongoDB connection string",
    );
    process.exit(1);
  }

  console.log("✅ Environment variables validated");
};

module.exports = validateEnv;
