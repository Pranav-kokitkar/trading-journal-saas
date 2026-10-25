const envBaseUrl = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))?.trim();
const fallbackBaseUrl = import.meta.env.PROD
  ? window.location.origin
  : "http://localhost:3000";

const rawBaseUrl =
  envBaseUrl && envBaseUrl.length > 0 ? envBaseUrl : fallbackBaseUrl;

export const BASE_URL = rawBaseUrl.replace(/\/+$/, "").replace(/\/api$/i, "");
export const API_BASE_URL = `${BASE_URL}/api`;
