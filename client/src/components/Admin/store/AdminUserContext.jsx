import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";

const AdminUsersContext = createContext();

export const AdminUsersProvider = ({ children }) => {
  const { authorizationToken } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  /* ------------------ API CALLS ------------------ */

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
      if (response.ok) {
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
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
        closeUserModal();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
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

      if (response.ok) {
        await getAllUsers();
        closeUserModal();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  /* ------------------ UI HELPERS ------------------ */

  const openUserModal = (user) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setIsUserModalOpen(false);
  };

  /* ------------------ EFFECT ------------------ */

  useEffect(() => {
    if (authorizationToken) {
      getAllUsers();
    }
  }, [authorizationToken]);

  return (
    <AdminUsersContext.Provider
      value={{
        users,
        loading,
        selectedUser,
        isUserModalOpen,
        getAllUsers,
        deleteUser,
        updateUser,
        openUserModal,
        closeUserModal,
      }}
    >
      {children}
    </AdminUsersContext.Provider>
  );
};

export const useAdminUsers = () => {
  return useContext(AdminUsersContext);
};
