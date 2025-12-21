import { useNavigate } from "react-router-dom";
import { useAdminAccounts } from "../store/AdminAccountsContext";
import styles from "./AdminAccounts.module.css";
import { Pagination } from "../../Pagination";

export const AdminAccounts = () => {
  const {
    accounts,
    totalAccounts,
    loading,
    loadingAccounts,
    page,
    setPage,
    totalPages,
    activeAccounts,
    disabledAccounts,
  } = useAdminAccounts();

  if (loading) {
    return <p className={styles.loading}>Loading accounts...</p>;
  }

  return (
    <section className={styles.page}>
      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span>Total Accounts</span>
          <h3>{totalAccounts}</h3>
        </div>
        <div className={styles.statCard}>
          <span>Active</span>
          <h3>{activeAccounts}</h3>
        </div>
        <div className={styles.statCard}>
          <span>Disabled</span>
          <h3>{disabledAccounts}</h3>
        </div>
      </div>

      {loadingAccounts ? (
        <p className={styles.loading}>Loading accounts...</p>
      ) : (
        <DisplayAccounts accounts={accounts} />
      )}
      <Pagination onPageChange={setPage} page={page} totalPages={totalPages} />
    </section>
  );
};

const DisplayAccounts = ({ accounts, setPage, page, totalAccounts, limit }) => {
  const navigate = useNavigate();

  if (!accounts || accounts.length === 0) {
    return <p className={styles.empty}>No accounts found</p>;
  }

  return (
    <div className={styles.cardsGrid}>
      {accounts.map((a) => (
        <div
          key={a._id}
          className={styles.accountCard}
          onClick={() => navigate(`/admin/accounts/${a._id}`)}
        >
          <div className={styles.cardHeader}>
            <h3 className={styles.accountName}>{a.name}</h3>
            <span className={`${styles.status} ${styles[a.status]}`}>
              {a.status}
            </span>
          </div>

          <div className={styles.cardBody}>
            <p>
              <strong>Balance:</strong> ₹{a.currentBalance.toFixed(2)}
            </p>
            <p>
              <strong>Total Trades:</strong> {a.totalTrades}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(a.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
