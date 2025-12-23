import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";

const AdminUsersContext = createContext();

export const AdminUsersProvider = ({ children }) => {
  const { authorizationToken } = useAuth();

  /* ------------------ DATA STATE ------------------ */
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [totalUsers, setTotalUsers] = useState(0);
  const [adminUsers, setAdminUsers] = useState(0);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");

  /* ------------------ UI STATE ------------------ */
  const [loading, setLoading] = useState(true); // initial page load
  const [loadingUsers, setLoadingUsers] = useState(false); // pagination / refetch
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  /* ------------------ PAGINATION STATE ------------------ */
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // frontend-controlled
  const [totalPages, setTotalPages] = useState(1);

  /* ------------------ API CALL ------------------ */
  const getAllUsers = async ({ initial = false } = {}) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setLoadingUsers(true);
      }

      let url = `${
        import.meta.env.VITE_API_URL
      }/api/admin/users?page=${page}&limit=${limit}`;

      if (search) {
        url += `&search=${search}`;
      }
      if (role !== "all") {
        url += `&role=${role}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: authorizationToken,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }

      setUsers(data.users);
      setTotalUsers(data.stats.totalUsers);
      setAdminUsers(data.stats.adminUsers);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
      setLoadingUsers(false);
    }
  };

  /* ------------------ CRUD ACTIONS ------------------ */
  const deleteUser = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

      if (response.ok) {
        // handle edge case: deleting last item on page
        if (users.length === 1 && page > 1) {
          setPage((prev) => prev - 1);
        } else {
          await getAllUsers();
        }
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

  /* ------------------ MODAL HELPERS ------------------ */
  const openUserModal = (user) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setIsUserModalOpen(false);
  };

  const resetFilters = () => {
    setSearch("");
    setRole("all");
    setPage(1);
  };

  /* ------------------ EFFECTS ------------------ */

  // Initial load (runs once when token becomes available)
  useEffect(() => {
    if (authorizationToken) {
      getAllUsers({ initial: true });
    }
  }, [authorizationToken]);

  // Pagination changes
  useEffect(() => {
    if (authorizationToken) {
      getAllUsers();
    }
  }, [page,search,role, authorizationToken]);

  /* ------------------ CONTEXT VALUE ------------------ */
  return (
    <AdminUsersContext.Provider
      value={{
        users,
        selectedUser,
        isUserModalOpen,
        loading,
        loadingUsers,

        totalUsers,
        adminUsers,

        page,
        setPage,
        totalPages,

        getAllUsers,
        deleteUser,
        updateUser,
        openUserModal,
        closeUserModal,

        setSearch,
        role,
        setRole,
        resetFilters,
      }}
    >
      {children}
    </AdminUsersContext.Provider>
  );
};

export const useAdminUsers = () => {
  const context = useContext(AdminUsersContext);
  if (!context) {
    throw new Error("useAdminUsers must be used within AdminUsersProvider");
  }
  return context;
};
