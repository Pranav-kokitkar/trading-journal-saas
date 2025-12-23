import { useEffect, useState } from "react";
import { Pagination } from "../../Pagination";
import { useAdminTrades } from "../store/AdminTradesContext";
import { AdminDisplayTrades } from "./AdminDisplayTrades";
import styles from "./AdminTrades.module.css";

export const AdminTrades = () => {
  const {
    trades,
    stats,
    loading,
    loadingTrades,
    setPage,
    page,
    totalPages,
    setSearch,
    setTradeStatus,
    setTradeResult,
    setDateFrom,
    setDateTo,
    resetFilters,
    tradeStatus,
    tradeResult,
    dateFrom,
    dateTo,
  } = useAdminTrades();

  const [searchInput, setSearchInput] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

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
          <h3 className={styles.statValue}>{stats.totalTrades}</h3>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Live Trades</p>
          <h3 className={styles.statValue}>{stats.totalLiveTrades}</h3>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Exited Trades</p>
          <h3 className={styles.statValue}>{stats.totalExitedTrades}</h3>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Win Rate</p>
          <h3 className={styles.statValue}>{stats.winRate}%</h3>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total PnL</p>
          <h3
            className={
              stats.totalPnL >= 0 ? styles.pnlPositive : styles.pnlNegative
            }
          >
            ${stats.totalPnL.toFixed(2)}
          </h3>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Avg R:R</p>
          <h3 className={styles.statValue}>{stats.avgRR.toFixed(2)}</h3>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by symbol, user, or account"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={tradeStatus}
          onChange={handleFilterChange(setTradeStatus)}
          className={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="live">Live</option>
          <option value="exited">Exited</option>
        </select>

        <select
          value={tradeResult}
          onChange={handleFilterChange(setTradeResult)}
          className={styles.filterSelect}
        >
          <option value="all">All Results</option>
          <option value="win">Win</option>
          <option value="loss">Loss</option>
          <option value="breakeven">Breakeven</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={handleFilterChange(setDateFrom)}
          className={styles.dateInput}
        />

        <input
          type="date"
          value={dateTo}
          onChange={handleFilterChange(setDateTo)}
          className={styles.dateInput}
        />

        <button onClick={resetFilters} className={styles.resetBtn}>
          Reset
        </button>
      </div>

      {/* Trades List */}
      <div className={styles.listSection}>
        {loadingTrades ? (
          <p className={styles.loading}>Loading trades...</p>
        ) : (
          <AdminDisplayTrades trades={trades} />
        )}
      </div>

      <Pagination onPageChange={setPage} page={page} totalPages={totalPages} />
    </section>
  );
};
