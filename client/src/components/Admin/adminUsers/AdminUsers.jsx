import { useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";
import styles from "./adminusers.module.css";
import { UserEditModal } from "./UserEditModal";

export const AdminUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authorizationToken } = useAuth();
  const [userModal, setUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const getAllUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users`,
        {
          method: "GET",
          headers: { Authorization: authorizationToken },
        }
      );
      const data = await response.json();
      if (response.ok) setUsers(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: authorizationToken },
        }
      );
      if (response.ok) {
        await getAllUsers();
        setUserModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateUser = async (id, updatedData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: authorizationToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );
      if (!response.ok) return;
      await getAllUsers();
      setUserModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.log(error);
    }
  };

  const showUser = (user) => {
    setSelectedUser(user);
    setUserModal(true);
  };

  useEffect(() => {
    if (authorizationToken) getAllUsers();
  }, [authorizationToken]);

  if (loading) return <p>Loading...</p>;

  return (
    <section className={styles.adminUsers}>
      {userModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => {
            setUserModal(false);
            setSelectedUser(null);
          }}
          onDelete={() => deleteUser(selectedUser._id)}
          onUpdate={(updatedData) => updateUser(selectedUser._id, updatedData)}
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
        <DisplayUsers users={users} showUser={showUser} />
      </div>
    </section>
  );
};

const DisplayUsers = ({ users, showUser }) => {
  return (
    <div className={styles.usersGrid}>
      {users.map((u, index) => (
        <div key={u._id ?? `user-${index}`} className={styles.usersCard}>
          <div className={styles.userInfo}>
            <p>{u.name}</p>
            <p>{u.isAdmin ? "Admin" : "User"}</p>
          </div>
          <button className={styles.editBtn} onClick={() => showUser(u)}>
            Edit
          </button>
        </div>
      ))}
    </div>
  );
};
