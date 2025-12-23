import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../store/Auth";
import styles from "./AdminUserDetails.module.css";
import { useAdminUsers } from "../store/AdminUserContext";
import { UserEditModal } from "./UserEditModal";

export const AdminUserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [userAccounts, setUserAccounts] = useState([]);

  const { authorizationToken } = useAuth();
  const {
    isUserModalOpen,
    closeUserModal,
    deleteUser,
    updateUser,
    openUserModal,
  } = useAdminUsers();

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);

  const formatDate = (date) => new Date(date).toLocaleDateString("en-GB");

  const getUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

      if (!response.ok) return;

      const res_data = await response.json();
      setUserDetails(res_data.user);
      setUserAccounts(res_data.accounts || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserData();
  }, [id, authorizationToken]);

  if (loading) {
    return <p className={styles.loading}>Loading user details...</p>;
  }

  if (!userDetails) {
    return <p className={styles.loading}>User not found</p>;
  }

  return (
    <section className={styles.page}>
      {isUserModalOpen && (
        <UserEditModal
          userDetails={userDetails}
          onClose={closeUserModal}
          onDelete={deleteUser}
          onUpdate={(updatedData) => updateUser(userDetails._id, updatedData)}
          getUserData={getUserData}
        />
      )}

      {/* ================= HEADER ================= */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className={styles.center}>
          <h2 className={styles.userName}>{userDetails.name}</h2>
          <p className={styles.email}>{userDetails.email}</p>
        </div>

        <span
          className={`${styles.roleBadge} ${
            userDetails.isAdmin ? styles.admin : styles.user
          }`}
        >
          {userDetails.isAdmin ? "Admin" : "User"}
        </span>

        <button className={styles.editBtn} onClick={openUserModal}>
          Edit
        </button>
      </header>

      {/* ================= SUMMARY ================= */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>User ID</span>
          <h3>{userDetails._id}</h3>
        </div>

        <div className={styles.summaryCard}>
          <span>Total Accounts</span>
          <h3>{userAccounts.length}</h3>
        </div>

        <div className={styles.summaryCard}>
          <span>Joined On</span>
          <h3>{formatDate(userDetails.createdAt)}</h3>
        </div>
      </div>

      {/* ================= ACCOUNTS ================= */}
      <section className={styles.accountsSection}>
        <h3 className={styles.sectionTitle}>User Accounts</h3>

        {userAccounts.length === 0 ? (
          <p className={styles.placeholder}>No accounts found</p>
        ) : (
          <div className={styles.accountsGrid}>
            {userAccounts.map((acc) => (
              <div
                key={acc._id}
                className={styles.accountCard}
                onClick={() => navigate(`/admin/accounts/${acc._id}`)}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <h4 className={styles.accountName}>{acc.name}</h4>
                    <span className={styles.subText}>
                      Created {formatDate(acc.createdAt)}
                    </span>
                  </div>

                  <span className={`${styles.status} ${styles[acc.status]}`}>
                    {acc.status}
                  </span>
                </div>

                <div className={styles.metrics}>
                  <div>
                    <span>Balance</span>
                    <strong>{formatCurrency(acc.currentBalance)}</strong>
                  </div>
                  <div>
                    <span>Total Trades</span>
                    <strong>{acc.totalTrades}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
};
