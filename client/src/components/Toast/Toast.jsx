import React from "react";
import toast from "react-hot-toast";
import styles from "./Toast.module.css";

/**
 * Custom Toast Component with close button
 * @param {Object} props - Toast props
 * @param {string} props.message - Toast message text
 * @param {string} props.type - Toast type: 'success', 'error', 'loading', 'default'
 * @param {string} props.toastId - Toast ID for dismissing
 */
export const Toast = ({ message, type = "default", toastId }) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "loading":
        return "⟳";
      default:
        return "ℹ";
    }
  };

  return (
    <div className={`${styles.toast} ${styles[`toast-${type}`]}`}>
      <div className={styles.toastContent}>
        <span className={`${styles.icon} ${styles[`icon-${type}`]}`}>
          {getIcon()}
        </span>
        <span className={styles.message}>{message}</span>
      </div>
      <button
        className={styles.closeBtn}
        onClick={() => toast.dismiss(toastId)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

/**
 * Custom toast handlers with close button
 */
export const customToast = {
  /**
   * Show success toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options (duration, etc)
   */
  success: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <Toast
          message={message}
          type="success"
          toastId={t.id}
        />
      ),
      {
        duration: options.duration || 3000,
        position: "top-center",
        ...options,
      }
    );
  },

  /**
   * Show error toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options (duration, etc)
   */
  error: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <Toast
          message={message}
          type="error"
          toastId={t.id}
        />
      ),
      {
        duration: options.duration || 4000,
        position: "top-center",
        ...options,
      }
    );
  },

  /**
   * Show loading toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options (duration, etc)
   */
  loading: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <Toast
          message={message}
          type="loading"
          toastId={t.id}
        />
      ),
      {
        duration: Infinity,
        position: "top-center",
        ...options,
      }
    );
  },

  /**
   * Show default info toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options (duration, etc)
   */
  info: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <Toast
          message={message}
          type="default"
          toastId={t.id}
        />
      ),
      {
        duration: options.duration || 4000,
        position: "top-center",
        ...options,
      }
    );
  },
};
