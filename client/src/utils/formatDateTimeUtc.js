const pad = (value) => String(value).padStart(2, "0");

export const formatDateTimeUtc = (value, options = {}) => {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  const includeSeconds = options.includeSeconds !== false;

  return `${year}-${month}-${day} ${hours}:${minutes}${includeSeconds ? `:${seconds}` : ""} UTC`;
};
