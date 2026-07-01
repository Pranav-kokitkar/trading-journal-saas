const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? window.location.origin : "http://localhost:3000");

export const exportTrades = async (format, accountId) => {
  const token = localStorage.getItem("token");
  const query = new URLSearchParams({ format });

  if (accountId) {
    query.set("accountId", accountId);
  }

  const response = await fetch(
    `${API_URL}/api/export/trades?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Export failed");
  }

  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `trading-journal.${format}`;
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
};
