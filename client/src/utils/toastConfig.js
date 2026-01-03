export const toastConfig = {
  duration: 4000,
  position: "top-center",

  // Styling
  style: {
    background: "#1e293b",
    color: "#f1f5f9",
    padding: "16px 20px",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "500",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },

  // Success
  success: {
    duration: 3000,
    style: {
      background: "#1e293b",
      color: "#f1f5f9",
      border: "1px solid #10b981",
    },
    iconTheme: {
      primary: "#10b981",
      secondary: "#1e293b",
    },
  },

  // Error
  error: {
    duration: 4000,
    style: {
      background: "#1e293b",
      color: "#f1f5f9",
      border: "1px solid #ef4444",
    },
    iconTheme: {
      primary: "#ef4444",
      secondary: "#1e293b",
    },
  },

  // Loading
  loading: {
    style: {
      background: "#1e293b",
      color: "#f1f5f9",
      border: "1px solid #fbbf24",
    },
    iconTheme: {
      primary: "#fbbf24",
      secondary: "#1e293b",
    },
  },
};
