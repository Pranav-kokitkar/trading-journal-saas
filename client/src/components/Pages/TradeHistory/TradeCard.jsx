import { useState } from "react";
import styles from "./TradeHistory.module.css";
import { NavLink } from "react-router-dom";

export const TradeCard = ({ savedTrade }) => {

  if (!savedTrade || savedTrade.length === 0)
    return <p className={styles.notrades}>No trades yet</p>;

  

  return (
    <>
      {savedTrade.map((tradeData) => {
        const id =
          tradeData.id ??
          tradeData._id ??
          tradeData.tradeNumber ??
          Math.random();
        const date =
          tradeData.dateNtime ?? tradeData.dateTime ?? tradeData.date ?? "";
        return (
          <NavLink key={id} to={`/app/trade/${id}`}>
            <div className={styles.tradecard}>
              <div className={styles.logo}>📈</div>

              <div className={styles.symbol}>
                <div>{tradeData.symbol || tradeData.marketType}</div>
                <div className={styles.belowsymbol}>
                  <p>{tradeData.marketType}</p>
                  <p>{date}</p>
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
