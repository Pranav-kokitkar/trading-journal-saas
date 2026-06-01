import { useContext, useEffect } from "react";
import styles from "./addtrade.module.css";
import { calculateTradeValues } from "../../../utils/tradeUtils";
import { AccountContext } from "../../../context/AccountContext";

export const TradeCalculator = ({ trade, setTrade }) => {
  const { accountDetails } = useContext(AccountContext);
  const accountBalance = accountDetails?.currentBalance || 0;

  const {
    rr,
    rrError,
    riskamount,
    lossError,
    lossWarning,
    grossPnl,
    executionCost,
    pnl,
    profitError,
    generalError,
  } = calculateTradeValues({ trade, accountBalance });

  const entry = Number(trade.entryPrice) || 0;
  const stoploss = Number(trade.stoplossPrice) || 0;
  const takeprofit = Number(trade.takeProfitPrice) || 0;
  const direction = (trade.tradeDirection || trade.tradedirection || "")
    .toString()
    .toLowerCase();
  const priceDiff = Math.abs(entry - stoploss);
  const plannedRR =
    entry && stoploss && takeprofit && priceDiff > 0
      ? direction === "short" || direction === "sell"
        ? (entry - takeprofit) / priceDiff
        : (takeprofit - entry) / priceDiff
      : 0;
  const normalizedSlippage = Number(trade.slippage || 0);
  const normalizedCommission = Number(trade.commission || 0);
  const realizedRR = Number.isFinite(Number(rr)) ? Number(rr) : 0;
  const statusLabel =
    trade.tradeStatus === "live"
      ? "Open"
      : trade.tradeStatus === "exited"
        ? "Exited"
        : trade.tradeStatus === "missed"
          ? "Missed"
          : "Not set";

  const metrics = [
    {
      label: "Planned RR",
      value: plannedRR ? `1:${plannedRR.toFixed(2)}` : "—",
      emphasis: true,
    },
    {
      label: "Realized RR",
      value: realizedRR ? `1:${Number(realizedRR).toFixed(2)}` : "—",
      emphasis: true,
    },
    {
      label: "Gross PNL",
      value: `${grossPnl < 0 ? "-" : ""}$${Math.abs(Number(grossPnl || 0)).toFixed(2)}`,
      emphasis: false,
    },
    {
      label: "Commission",
      value: normalizedCommission > 0 ? `-$${normalizedCommission.toFixed(2)}` : "$0.00",
      emphasis: false,
    },
    {
      label: "Slippage",
      value: normalizedSlippage > 0 ? `-$${normalizedSlippage.toFixed(2)}` : "$0.00",
      emphasis: false,
    },
    {
      label: "Total Fees",
      value: executionCost > 0 ? `-$${Number(executionCost || 0).toFixed(2)}` : "$0.00",
      emphasis: false,
    },
    {
      label: "Risk",
      value: riskamount !== "-" ? `$${riskamount}` : "—",
      emphasis: true,
    },
    {
      label: "Net PNL",
      value: `${Number(pnl || 0) < 0 ? "-" : ""}$${Math.abs(Number(pnl || 0)).toFixed(2)}`,
      emphasis: true,
    },
  ];

  // Update trade state
  useEffect(() => {
    if (setTrade) {
      setTrade((prev) => ({
        ...prev,
        pnl,
        riskamount,
        rr,
      }));
    }
  }, [pnl, riskamount, rr]);

  return (
    <div className={styles.card}>
      <h3 className={styles.sectionHeader}>Performance Summary</h3>
      <div className={styles.summaryBadge}>
        <span className={styles.summaryBadgeLabel}>Trade Execution</span>
        <span className={styles.summaryBadgeValue}>{statusLabel}</span>
      </div>
      {generalError && (
        <p className={styles.summaryError}>{generalError}</p>
      )}

      <div className={styles.summaryGrid}>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`${styles.summaryMetric} ${metric.emphasis ? styles.summaryMetricEmphasis : ""}`}
          >
            <span className={styles.summaryLabel}>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div className={styles.summaryMessages}>
        {rrError && <p className={styles.summaryError}>{rrError}</p>}
        {lossError && <p className={styles.summaryError}>{lossError}</p>}
        {lossWarning && <p className={styles.summaryWarning}>{lossWarning}</p>}
        {profitError && <p className={styles.summaryError}>{profitError}</p>}
      </div>
    </div>
  );
};
