const API_URL = import.meta.env.VITE_API_URL;

export const exportTrades = async (format) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/export/trades?format=${format}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
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
