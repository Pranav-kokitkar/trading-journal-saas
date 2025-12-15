import { useEffect, useState } from "react";
import styles from "./adminusermodal.module.css";

export const UserEditModal = ({ user, onDelete, onUpdate, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({
    name: "",
    email: "",
    isAdmin: false,
  });

  useEffect(() => {
    setUpdatedUser({
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUpdatedUser((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    onUpdate(updatedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setUpdatedUser({
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
    setIsEditing(false);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.field}>
          <label>Name</label>
          {isEditing ? (
            <input
              name="name"
              value={updatedUser.name}
              onChange={handleChange}
              className={styles.editTitleInput}
            />
          ) : (
            <p>{user.name}</p>
          )}
        </div>

        <div className={styles.field}>
          <label>Email</label>
          {isEditing ? (
            <input
              name="email"
              value={updatedUser.email}
              onChange={handleChange}
              className={styles.editTitleInput}
            />
          ) : (
            <p>{user.email}</p>
          )}
        </div>

        <div className={styles.field}>
          <label>Admin</label>
          {isEditing ? (
            <input
              type="checkbox"
              name="isAdmin"
              checked={updatedUser.isAdmin}
              onChange={handleChange}
            />
          ) : (
            <p>{user.isAdmin ? "Yes" : "No"}</p>
          )}
        </div>

        <div className={styles.actions}>
          {isEditing ? (
            <>
              <button onClick={handleSave} className={styles.saveButton}>
                Save
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className={styles.editButton}
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(user._id)}
                className={styles.deleteButton}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <button className={styles.modalCloseButton} onClick={onClose}>
        ✕
      </button>
    </div>
  );
};
