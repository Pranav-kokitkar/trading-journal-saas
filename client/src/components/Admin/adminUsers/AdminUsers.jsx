import styles from "./adminusers.module.css";
import { UserEditModal } from "./UserEditModal";
import { useAdminUsers } from "../store/AdminUserContext";

export const AdminUser = () => {
  const {
    users,
    loading,
    selectedUser,
    isUserModalOpen,
    openUserModal,
    closeUserModal,
    deleteUser,
    updateUser,
  } = useAdminUsers();

  if (loading) return <p>Loading...</p>;

  return (
    <section className={styles.adminUsers}>
      {isUserModalOpen && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={closeUserModal}
          onDelete={() => deleteUser(selectedUser._id)}
          onUpdate={(updatedData) =>
            updateUser(selectedUser._id, updatedData)
          }
        />
      )}

      <div className={styles.adminUsersHeaders}>
        <div className={styles.totalUserscontainer}>
          <h3>Total Users:</h3>
          <p>{users.length}</p>
        </div>

        <div className={styles.totalAdmincontainer}>
          <h3>Admin Users:</h3>
          <p>{users.filter((u) => u.isAdmin).length}</p>
        </div>
      </div>

      <div>
        <h2>Users :</h2>
        <DisplayUsers users={users} onEdit={openUserModal} />
      </div>
    </section>
  );
};

const DisplayUsers = ({ users, onEdit }) => {
  return (
    <div className={styles.usersGrid}>
      {users.map((u) => (
        <div key={u._id} className={styles.usersCard}>
          <div className={styles.userInfo}>
            <p>{u.name}</p>
            <p>{u.isAdmin ? "Admin" : "User"}</p>
          </div>
          <button className={styles.editBtn} onClick={() => onEdit(u)}>
            Edit
          </button>
        </div>
      ))}
    </div>
  );
};
