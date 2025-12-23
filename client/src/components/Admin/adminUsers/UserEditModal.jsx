import { useEffect, useState } from "react";
import styles from "./adminusermodal.module.css";

export const UserEditModal = ({
  userDetails,
  onDelete,
  onUpdate,
  onClose,
  getUserData,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({
    name: "",
    email: "",
    isAdmin: false,
  });

  useEffect(() => {
    if (userDetails) {
      setUpdatedUser({
        name: userDetails.name,
        email: userDetails.email,
        isAdmin: userDetails.isAdmin,
      });
    }
  }, [userDetails]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUpdatedUser((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    onUpdate(updatedUser);
    getUserData();
    setIsEditing(false);
  };

  const handleCancel = () => {
    setUpdatedUser({
      name: userDetails.name,
      email: userDetails.email,
      isAdmin: userDetails.isAdmin,
    });
    setIsEditing(false);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {/* Name */}
        <div className={styles.field}>
          <label>Name</label>
          {isEditing ? (
            <input
              name="name"
              value={updatedUser.name}
              onChange={handleChange}
              className={styles.input}
            />
          ) : (
            <p>{userDetails.name}</p>
          )}
        </div>

        {/* Email */}
        <div className={styles.field}>
          <label>Email</label>
          {isEditing ? (
            <input
              name="email"
              value={updatedUser.email}
              onChange={handleChange}
              className={styles.input}
            />
          ) : (
            <p>{userDetails.email}</p>
          )}
        </div>

        {/* Admin */}
        <div className={styles.fieldRow}>
          <label>Admin</label>
          {isEditing ? (
            <input
              type="checkbox"
              name="isAdmin"
              checked={updatedUser.isAdmin}
              onChange={handleChange}
            />
          ) : (
            <span
              className={`${styles.badge} ${
                userDetails.isAdmin ? styles.admin : styles.user
              }`}
            >
              {userDetails.isAdmin ? "Yes" : "No"}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {isEditing ? (
            <>
              <button onClick={handleSave} className={styles.saveBtn}>
                Save
              </button>
              <button onClick={handleCancel} className={styles.cancelBtn}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className={styles.editBtn}
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(userDetails._id)}
                className={styles.deleteBtn}
              >
                Delete
              </button>
            </>
          )}
        </div>

        {/* Close */}
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};
