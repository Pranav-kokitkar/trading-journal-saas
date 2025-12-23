import { useState } from "react";
import styles from "./AdminContactModal.module.css";

export const AdminContactModal = ({ contact, onClose, updateStatus }) => {
  if (!contact) return null;

  const [updatedStatus, setUpdatedStatus] = useState({
    status: contact.status,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedStatus((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.subject}>{contact.subject}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.row}>
            <span className={styles.label}>Name</span>
            <span className={styles.value}>{contact.name}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Email</span>
            <span className={styles.value}>{contact.email}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Submitted</span>
            <span className={styles.value}>
              {new Date(contact.submittedAt).toLocaleString()}
            </span>
          </div>

          <div className={styles.messageBox}>
            <span className={styles.label}>Message</span>
            <p className={styles.message}>{contact.message}</p>
          </div>

          {contact.screenshotUrl && (
            <div className={styles.screenshot}>
              <span className={styles.label}>Screenshot</span>
              <img src={contact.screenshotUrl} alt="Screenshot" />
            </div>
          )}

          {/* Status Update */}
          <div className={styles.statusRow}>
            <span className={styles.label}>Status</span>

            <select
              className={styles.statusSelect}
              name="status"
              value={updatedStatus.status}
              onChange={handleChange}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <button
              className={styles.saveBtn}
              onClick={() => updateStatus(contact._id, updatedStatus)}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
