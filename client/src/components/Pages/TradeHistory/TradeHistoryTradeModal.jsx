import { useNavigate } from "react-router-dom";
import styles from "../../../styles/tradehistory.module.css";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { formatDateTimeUtc } from "../../../utils/formatDateTimeUtc";

const formatDuration = (trade) => {
  if (trade?.durationText) return trade.durationText;
  const minutes = Number(trade?.durationMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  if (minutes < 60) return `${minutes.toFixed(0)}m`;
  return `${(minutes / 60).toFixed(minutes >= 240 ? 0 : 1)}h`;
};

const formatMoney = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `$${numeric}` : "—";
};

const getTradeId = (trade) => trade?.id ?? trade?._id ?? trade?.tradeNumber;

export const TradeHistoryTradeModal = ({ trade, onClose, page }) => {
  const navigate = useNavigate();
  useBodyScrollLock(Boolean(trade));

  if (!trade) return null;

  const tradeScreenshots = Array.isArray(trade.screenshots) ? trade.screenshots : [];
  const visibleScreenshot = tradeScreenshots[0] || null;
  const remaining = Math.max(0, tradeScreenshots.length - 1);

  const pnlValue = Number(trade.pnl);
  const confidenceValue = Number(trade.confidence ?? trade.confidenceLevel ?? 0);
  const direction = trade.tradedirection ?? trade.tradeDirection ?? "—";
  const isPositive = Number.isFinite(pnlValue) ? pnlValue >= 0 : false;
  const strategyName =
    trade.strategy && typeof trade.strategy === "object" ? trade.strategy.name : trade.strategy || "—";
  const statusText = trade.tradeStatus;
  const showStatus = statusText && String(statusText).toLowerCase() !== "exited";

  const riskAmount = trade.risk ?? trade.riskAmount ?? trade.riskAmt ?? null;
  const riskPercent = trade.riskPercent ?? trade.riskPct ?? trade.riskPercentage ?? null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalEyebrow}>Trade preview</p>
            <h3 className={styles.modalTitle}>
              {trade.symbol || "Trade"} <span>#{trade.tradeNumber ?? getTradeId(trade) ?? "—"}</span>
            </h3>
            <p className={styles.modalSubtitle}>{formatDateTimeUtc(trade.entryTime ?? trade.dateTime ?? trade.dateNtime)}</p>
          </div>

          <button type="button" className={styles.modalCloseButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalSummaryRow}>
          {showStatus && <span className={styles.modalStatusPill}>{statusText}</span>}
          <span className={styles.modalMarketText}>{trade.marketType || "—"}</span>
          <span className={styles.modalDirectionText}>{direction}</span>
        </div>

        <div className={styles.modalBodySplit}>
          <div className={styles.modalScreenshotSection}>

            {visibleScreenshot ? (
              <div className={styles.modalScreenshotGrid}>
                <div className={styles.modalScreenshotWrapper}>
                  <img src={visibleScreenshot} alt="Trade screenshot" />
                  {remaining > 0 && (
                    <span className={styles.modalScreenshotMoreBadge}>+{remaining}</span>
                  )}
                </div>
              </div>
            ) : (
              <p className={styles.modalEmptyState}>No screenshots added</p>
            )}
          </div>

          <div className={styles.modalMetricsPanel}>
            <div className={styles.modalMetricsGrid}>
              <div className={styles.modalMetricCard}>
                <span className={styles.modalMetricLabel}>PnL</span>
                <span className={`${styles.modalMetricValue} ${isPositive ? styles.pnlPositive : styles.pnlNegative}`}>
                  {formatMoney(trade.pnl)}
                </span>
              </div>

              <div className={styles.modalMetricCard}>
                <span className={styles.modalMetricLabel}>RR</span>
                <span className={styles.modalMetricValue}>{trade.rr ?? "—"}</span>
              </div>

              <div className={styles.modalMetricCard}>
                <span className={styles.modalMetricLabel}>Risk</span>
                <span className={styles.modalMetricValue}>{formatMoney(riskAmount)}</span>
              </div>

              <div className={styles.modalMetricCard}>
                <span className={styles.modalMetricLabel}>Risk %</span>
                <span className={styles.modalMetricValue}>{riskPercent ? `${riskPercent}%` : "—"}</span>
              </div>

              <div className={styles.modalMetricCard}>
                <span className={styles.modalMetricLabel}>Confidence</span>
                <span className={styles.modalMetricValue}>{confidenceValue}%</span>
              </div>

              <div className={styles.modalMetricCard}>
                <span className={styles.modalMetricLabel}>Duration</span>
                <span className={styles.modalMetricValue}>{formatDuration(trade)}</span>
              </div>

              <div className={styles.modalMetricCard}>
                <span className={styles.modalMetricLabel}>Strategy</span>
                <span className={styles.modalMetricValue}>{strategyName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.fullDetailsButton}
            onClick={() => {
              onClose?.();
              navigate(`/app/trade/${getTradeId(trade)}`, {
                state: { from: "/app/trade-history", page },
              });
            }}
          >
            Full details
          </button>

          <button type="button" className={styles.modalSecondaryButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
