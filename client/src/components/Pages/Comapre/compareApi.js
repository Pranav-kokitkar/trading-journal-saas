import toast from "react-hot-toast";

/**
 * Compare two datasets of trades
 * @param {Object} payload - Comparison payload with dimensions and currentAccountId
 * @param {string} authorizationToken - Authorization token
 * @returns {Promise<Object>} Comparison results
 */
export const compareDatasets = async (payload, authorizationToken) => {
  try {
    const response = await fetch(
      `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/compare`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorizationToken,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (response.ok) {
      toast.success("Comparison completed successfully");
      return { success: true, data: data.comparison };
    } else {
      toast.error(data.message || "Failed to compare datasets");
      console.error("Compare error:", data);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error("Error comparing datasets:", error);
    toast.error("Error comparing datasets");
    return { success: false, error: error.message };
  }
};
