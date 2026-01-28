/**
 * Validates required environment variables on startup
 * Fails fast if critical config is missing
 */

const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRETE_KEY", // Note: There's a typo in your env var name (should be SECRET)
  "PORT",
];

const validateEnv = () => {
  const missing = [];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

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
