/**
 * Toast utility that wraps react-hot-toast with custom styling and close button
 * Usage: toastHelper.success(message), toastHelper.error(message), etc.
 */
import { customToast } from "../components/Toast/Toast";

export const toastHelper = {
  success: (message, duration = 3000) =>
    customToast.success(message, { duration }),
  error: (message, duration = 4000) => customToast.error(message, { duration }),
  loading: (message) => customToast.loading(message),
  info: (message, duration = 4000) => customToast.info(message, { duration }),
};
