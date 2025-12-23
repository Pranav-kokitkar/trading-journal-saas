import { useState } from "react";
import styles from "./AdminAccountEditModal.module.css";
export const AdminAccountEditModal = ({
  EditAccount,
  onClose,
  name,
  status,
}) => {
  
  const [updatedData, setUpdatedData] = useState({
    name: name,
    status: status,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>Edit Account Details</h3>
        </div>

        {/* Form */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Account Name</label>
          <input
            className={styles.input}
            name="name"
            value={updatedData.name}
            onChange={handleChange}
            placeholder="Account name"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Status</label>
          <select
            className={styles.select}
            name="status"
            value={updatedData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.saveBtn}
            onClick={() => EditAccount(updatedData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
