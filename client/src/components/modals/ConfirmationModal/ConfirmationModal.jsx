import React from "react";
import styles from "./confirmationModal.module.css";

export const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h4>{title}</h4>
        <p>{message}</p>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelText}
          </button>

          <button className={styles.confirmBtn} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
