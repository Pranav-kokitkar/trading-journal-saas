import { Pagination } from "../../Pagination";
import { useAdminTrades } from "../store/AdminTradesContext";
import { AdminDisplayTrades } from "./AdminDisplayTrades";
import styles from "./AdminTrades.module.css"

export const AdminTrades = () => {
  const {
    trades,
    loading,
    loadingTrades,
    setPage,
    page,
    totalTrades,
    totalPages,
    totalExitedTrades,
    totalLiveTrades,
  } = useAdminTrades();

  if (loading) {
    return <div className={styles.loading}>Loading trades...</div>;
  }

  return (
    <section className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h2>All Trades</h2>
        <p>System-wide trade activity across all users and accounts</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Trades</p>
          <h3 className={styles.statValue}>{totalTrades}</h3>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Live Trades</p>
          <h3 className={styles.statValue}>
            {totalLiveTrades}
          </h3>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Exited Trades</p>
          <h3 className={styles.statValue}>
            {totalExitedTrades}
          </h3>
        </div>

        {/* <div className={styles.statCard}>
          <p className={styles.statLabel}>Net PnL</p>
          <h3
            className={
              trades.reduce((acc, t) => acc + t.pnl, 0) >= 0
                ? styles.pnlPositive
                : styles.pnlNegative
            }
          >
            {trades.reduce((acc, t) => acc + t.pnl, 0)}
          </h3>
        </div> */}
      </div>

      {/* Trades List */}
      <div className={styles.listSection}>
        {loadingTrades ? (
          <p>Loading tardes......</p>
        ) : (
          <AdminDisplayTrades trades={trades} />
        )}
      </div>
      <Pagination onPageChange={setPage} page={page} totalPages={totalPages} />
    </section>
  );
};