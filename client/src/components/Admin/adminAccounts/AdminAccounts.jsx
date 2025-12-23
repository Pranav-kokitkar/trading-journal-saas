import { useNavigate } from "react-router-dom";
import { useAdminAccounts } from "../store/AdminAccountsContext";
import styles from "./AdminAccounts.module.css";
import { Pagination } from "../../Pagination";
import { useEffect, useState } from "react";

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
    setSearch,
    setStatus,
    resetFilters,
  } = useAdminAccounts();

  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleChange = (e) => setSearchInput(e.target.value);

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

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

      {/* Filters */}
      <div className={styles.filters}>
        <input
          placeholder="Search by name or email"
          onChange={handleChange}
          value={searchInput}
          className={styles.searchInput}
        />

        <select onChange={handleStatusChange} className={styles.statusFilter}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>

        <button onClick={resetFilters} className={styles.resetBtn}>
          Reset
        </button>
      </div>

      {/* Accounts */}
      {loadingAccounts ? (
        <p className={styles.loading}>Loading accounts...</p>
      ) : (
        <DisplayAccounts accounts={accounts} />
      )}

      <Pagination onPageChange={setPage} page={page} totalPages={totalPages} />
    </section>
  );
};

const DisplayAccounts = ({ accounts }) => {
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
              <span>Balance</span>
              <strong>₹{a.currentBalance.toFixed(2)}</strong>
            </p>
            <p>
              <span>Total Trades</span>
              <strong>{a.totalTrades}</strong>
            </p>
            <p>
              <span>Created</span>
              <strong>{new Date(a.createdAt).toLocaleDateString()}</strong>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
