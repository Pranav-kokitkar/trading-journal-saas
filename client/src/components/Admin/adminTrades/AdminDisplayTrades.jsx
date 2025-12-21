import { useNavigate } from "react-router-dom";
import styles from "./AdminTrades.module.css";

export const AdminDisplayTrades = ({ trades }) => {
  const navigate = useNavigate();

  if (!trades || trades.length === 0) {
    return <div className={styles.empty}>No trades found</div>;
  }

  return (
    <div className={styles.wrapper}>
      {/* Table Header (hidden on mobile via CSS) */}
      <div className={`${styles.row} ${styles.tableHeader}`}>
        <span>Date</span>
        <span>User</span>
        <span>Account</span>
        <span>Symbol</span>
        <span>Side</span>
        <span>Result</span>
        <span>PnL</span>
        <span>Status</span>
        <span>Action</span>
      </div>

      {/* Rows */}
      {trades.map((t) => (
        <div key={t._id} className={styles.row}>
          <span data-label="Date">
            {new Date(t.dateTime).toLocaleDateString()}
          </span>

          <span data-label="User" className={styles.user}>
            {t.userId?.email || "—"}
          </span>

          <span data-label="Account">{t.accountId?.name || "—"}</span>

          <span data-label="Symbol" className={styles.symbol}>
            {t.symbol}
          </span>

          <span
            data-label="Side"
            className={t.tradeDirection === "BUY" ? styles.buy : styles.sell}
          >
            {t.tradeDirection}
          </span>

          <span
            data-label="Result"
            className={
              t.tradeResult === "WIN"
                ? styles.win
                : t.tradeResult === "LOSS"
                ? styles.loss
                : styles.be
            }
          >
            {t.tradeResult || "—"}
          </span>

          <span
            data-label="PnL"
            className={
              t.pnl > 0
                ? styles.pnlPositive
                : t.pnl < 0
                ? styles.pnlNegative
                : styles.pnlNeutral
            }
          >
            {t.pnl}
          </span>

          <span data-label="Status" className={styles.status}>
            {t.tradeStatus || "—"}
          </span>

          <button
            data-label="Action"
            className={styles.viewBtn}
            onClick={() => navigate(`/admin/trades/${t._id}`)}
          >
            View
          </button>
        </div>
      ))}
    </div>
  );
};
