import React from "react";
import styles from "../../../styles/tradehistory.module.css";
import { NavLink } from "react-router-dom";

const formatDuration = (tradeData) => {
  if (tradeData?.durationText) return tradeData.durationText;
  const minutes = Number(tradeData?.durationMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  if (minutes < 60) return `${minutes.toFixed(0)}m`;
  return `${(minutes / 60).toFixed(minutes >= 240 ? 0 : 1)}h`;
};

const formatDateTime = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
};

export const TradeCard = ({ savedTrade, currentPage = 1 }) => {

  if (!savedTrade || savedTrade.length === 0)
    return <p className={styles.notrades}>No trades</p>;

  const favicon = "/favicon2.ico";

  return (
    <div className={styles.tradeGrid}>
      {savedTrade.map((tradeData) => {
        const id =
          tradeData.id ??
          tradeData._id ??
          tradeData.tradeNumber ??
          Math.random();

        const imageSrc =
          (Array.isArray(tradeData.screenshots) && tradeData.screenshots[0]) ||
          tradeData.screenshot ||
          favicon;
        const isFallback = imageSrc === favicon;

        const pnlValue =
          tradeData.tradeStatus === "live"
            ? "Live"
            : tradeData.pnl !== null && tradeData.pnl !== undefined
            ? `$${tradeData.pnl}`
            : "$0";

        const confidence = Number(tradeData.confidence ?? tradeData.confidenceLevel ?? 0);
        const strategyName = tradeData.strategy && typeof tradeData.strategy === 'object' ? tradeData.strategy.name : tradeData.strategy;

        return (
          <NavLink
            key={id}
            to={`/app/trade/${id}`}
            state={{ from: "/app/trade-history", page: currentPage }}
            className={styles.tradeLink}
          >
            <div className={styles.tradecard}>
              <div className={styles.cardImage}>
                {isFallback ? (
                  <div className={styles.faviconWrapper}>
                    <img
                      src={favicon}
                      alt="favicon"
                      className={styles.faviconImg}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={imageSrc}
                    alt={tradeData.symbol || "trade screenshot"}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = favicon;
                    }}
                  />
                )}

                {/* Confidence bar */}
                <div className={styles.confidenceContainer} aria-hidden>
                  <div
                    className={styles.confidenceFill}
                    style={{ width: `${Math.max(0, Math.min(100, confidence || 0))}%` }}
                  />
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.symbolName}>{tradeData.symbol || tradeData.marketType}</div>
                <div className={styles.cardMeta}>
                  <div className={styles.leftMeta}>
                    <span className={styles.direction}>{tradeData.tradedirection ?? tradeData.tradeDirection ?? "—"}</span>
                    {strategyName && <span className={styles.strategyBadgeSmall}>📊 {strategyName}</span>}
                  </div>
                  <span className={tradeData.pnl >= 0 ? styles.pnlPositive : styles.pnlNegative}>{pnlValue}</span>
                </div>
              </div>
            </div>
          </NavLink>
        );
      })}
    </div>
  );
};
