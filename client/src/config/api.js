const rawBaseUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).trim();

export const BASE_URL = rawBaseUrl.replace(/\/+$/, "");
export const API_BASE_URL = `${BASE_URL}/api`;

// Temporary debug log for production API resolution.
console.log("BASE_URL:", BASE_URL);
