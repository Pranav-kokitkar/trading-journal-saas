import { useState } from "react";
import styles from "./confirmationModal.module.css";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";

export const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  useBodyScrollLock(isOpen);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isConfirming) return;

    try {
      setIsConfirming(true);
      await onConfirm?.();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h4>{title}</h4>
        <p>{message}</p>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={isConfirming}>
            {cancelText}
          </button>

          <button className={styles.confirmBtn} onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming ? "Working..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
