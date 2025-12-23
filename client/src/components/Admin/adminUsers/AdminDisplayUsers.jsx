import { useNavigate } from "react-router-dom";
import styles from "./adminusers.module.css";

export const AdminDisplayUsers = ({ users }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.usersGrid}>
      {users.map((u) => (
        <div
          key={u._id}
          className={styles.usersCard}
          onClick={() => navigate(`/admin/user/${u._id}`)}
        >
          <div className={styles.userInfo}>
            <p className={styles.userName}>{u.name}</p>
            <span
              className={`${styles.roleBadge} ${
                u.isAdmin ? styles.admin : styles.user
              }`}
            >
              {u.isAdmin ? "Admin" : "User"}
            </span>
          </div>

          <p className={styles.email}>{u.email}</p>
        </div>
      ))}
    </div>
  );
};
