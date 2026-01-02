import React from "react";
import styles from "./UpgradeProModal.module.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const UpgradeProModal = ({onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const navigate = useNavigate();

  const onUpgrade = ()=>{
    navigate("/app/upgrade");
    onClose();
  }
  
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Upgrade to Pro</h3>
          <p className={styles.subtitle}>
            Trade with clarity. Track without limits.
          </p>
          <p className={styles.currentPlan}>Current plan: Free</p>
        </div>

        <div className={styles.features}>
          <p>✔ Advanced filters (PnL, account, tags)</p>
          <p>✔ Up to 5 trading accounts</p>
          <p>✔ Performance analytics</p>
          <p>✔ Up to 3 screenshots per trade</p>
          <p>✔ Higher trade limits</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.upgradeBtn} onClick={onUpgrade}>
            Continue with Pro
          </button>
          <button className={styles.laterBtn} onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
