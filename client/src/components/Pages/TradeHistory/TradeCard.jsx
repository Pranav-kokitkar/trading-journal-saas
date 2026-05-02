import { useState } from "react";
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

export const TradeCard = ({ savedTrade }) => {

  if (!savedTrade || savedTrade.length === 0)
    return <p className={styles.notrades}>No trades</p>;

  return (
    <>
      {savedTrade.map((tradeData) => {
        const id =
          tradeData.id ??
          tradeData._id ??
          tradeData.tradeNumber ??
          Math.random();
        const date =
          tradeData.entryTime ?? tradeData.dateTime ?? tradeData.dateNtime ?? tradeData.date ?? "";
        const duration = formatDuration(tradeData);
        return (
          <NavLink key={id} to={`/app/trade/${id}`} className={styles.tradeLink}>
            <div className={styles.tradecard}>
              <div className={styles.logo}>📈</div>

              <div className={styles.symbol}>
                <div>{tradeData.symbol || tradeData.marketType}</div>
                <div className={styles.belowsymbol}>
                  <p>{tradeData.marketType}</p>
                  <p>{formatDateTime(date)}</p>
                  {duration && <p>Held: {duration}</p>}
                  {tradeData.strategy && typeof tradeData.strategy === 'object' && (
                    <p className={styles.strategyBadge}>
                      📊 {tradeData.strategy.name}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.tradequickdata}>
                <div>
                  <p>Direction</p>
                  <span>
                    {tradeData.tradedirection ??
                      tradeData.tradeDirection ??
                      "—"}
                  </span>
                </div>
                <div>
                  <p>RR</p>
                  <span>1:{tradeData.rr ?? "0"}</span>
                </div>
                <div>
                  <p>PNL</p>
                  <span>
                    {tradeData.tradeStatus === "live"
                      ? "Live"
                      : tradeData.pnl !== null && tradeData.pnl !== undefined
                      ? `$${tradeData.pnl}`
                      : "$0"}
                  </span>
                </div>
              </div>
            </div>
          </NavLink>
        );
      })}
    </>
  );
};
