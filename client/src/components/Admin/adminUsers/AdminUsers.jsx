import styles from "./adminusers.module.css";
import { UserEditModal } from "./UserEditModal";
import { useAdminUsers } from "../store/AdminUserContext";
import { Pagination } from "../../Pagination";
import { AdminDisplayUsers } from "./AdminDisplayUsers";
import { useState, useEffect } from "react";

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
    page,
    setPage,
    totalPages,
    totalUsers,
    adminUsers,
    setSearch,
    role,
    setRole,
    resetFilters,
  } = useAdminUsers();

  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  if (loading) {
    return <p className={styles.loading}>Loading users...</p>;
  }

  return (
    <section className={styles.adminUsers}>
      {isUserModalOpen && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={closeUserModal}
          onDelete={() => deleteUser(selectedUser._id)}
          onUpdate={(updatedData) => updateUser(selectedUser._id, updatedData)}
        />
      )}

      {/* ================= HEADER ================= */}
      <header className={styles.header}>
        <h2>Users Management</h2>
        <p>Manage platform users and permissions</p>
      </header>

      {/* ================= STATS ================= */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p>Total Users</p>
          <h3>{totalUsers}</h3>
        </div>

        <div className={styles.statCard}>
          <p>Admin Users</p>
          <h3>{adminUsers}</h3>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className={styles.filters}>
        <input
          placeholder="Search by name or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className={styles.roleFilter}
        >
          <option value="all">All Users</option>
          <option value="admin">Admin Only</option>
          <option value="user">Users Only</option>
        </select>

        <button onClick={resetFilters} className={styles.resetBtn}>
          Reset
        </button>
      </div>

      {/* ================= USERS LIST ================= */}
      <div className={styles.usersSection}>
        <h3 className={styles.sectionTitle}>Users</h3>
        <AdminDisplayUsers users={users} onEdit={openUserModal} />
      </div>

      <Pagination onPageChange={setPage} page={page} totalPages={totalPages} />
    </section>
  );
};
