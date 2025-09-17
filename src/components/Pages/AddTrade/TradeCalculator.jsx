import { useContext } from "react";
import styles from "./addtrade.module.css";
import { AccountContext } from "../../../context/AccountContext";

export const TradeCalculator = ({ trade }) => {
  const entry = parseFloat(trade.entryPrice) || 0;
  const stoploss = parseFloat(trade.stoplossPrice) || 0;
  const takeprofit = parseFloat(trade.takeProfitPrice) || 0;
  const tradedirection = (trade.tradedirection || "").toLowerCase();
  const marketType = (trade.marketType || "").toLowerCase();
  const riskAmount = parseFloat(trade.riskAmount) || 0;
  const tradeStatus = trade.tradeStatus || "";
  const symbol = (trade.symbol || "").toUpperCase();

  const {accountDetails, setAccountDetails} =useContext(AccountContext);


  const requiredFields = {
    entry,
    stoploss,
    tradedirection,
    marketType,
    riskAmount,
    tradeStatus,
  };
  const missingFields = Object.entries(requiredFields)
    .filter(([key, val]) => !val)
    .map(([key]) => key);

  // General top-level error if any main details missing
  const generalError = missingFields.length
    ? "Fill all above details to see the results."
    : "";

  // ===== RR calculation =====
  let rr = 0;
  let rrError = "";
  if (
    !missingFields.includes("entry") &&
    !missingFields.includes("stoploss") &&
    !missingFields.includes("tradedirection") &&
    (takeprofit || tradeStatus === "exited")
  ) {
    let rrExit =
      tradeStatus === "exited" && trade.exitedPrice?.length > 0
        ? parseFloat(trade.exitedPrice[0].price) || takeprofit
        : takeprofit;

    if (tradedirection === "buy" || tradedirection === "long") {
      if (entry <= stoploss)
        rrError = "Entry must be above Stoploss for Buy trades.";
      else rr = ((rrExit - entry) / (entry - stoploss)).toFixed(2);
    } else if (tradedirection === "sell" || tradedirection === "short") {
      if (entry >= stoploss)
        rrError = "Entry must be below Stoploss for Sell trades.";
      else rr = ((entry - rrExit) / (stoploss - entry)).toFixed(2);
    } else {
      rrError = "Unknown trade direction.";
    }
  }

  // ===== Potential Loss =====
  let potentialLoss = "-";
  let lossError = "";
  if (
    !missingFields.includes("entry") &&
    !missingFields.includes("stoploss") &&
    !missingFields.includes("riskAmount") &&
    marketType
  ) {
    const priceDiff = Math.abs(entry - stoploss);
    if (marketType === "crypto" || marketType === "stocks") {
      potentialLoss = riskAmount.toFixed(2);
    } else if (marketType === "forex") {
      const pipSize = symbol.includes("JPY") ? 0.01 : 0.0001;
      const pips = priceDiff / pipSize;
      if (pips <= 0) lossError = "Invalid Entry/Stoploss for Forex.";
      else potentialLoss = riskAmount.toFixed(2);
    } else lossError = "Unsupported market type.";
  } else if (!lossError && !missingFields.includes("marketType")) {
    lossError = "Enter Entry, Stoploss, and Risk Amount.";
  }

  // ===== Potential Profit =====
  let potentialProfit = "-";
  let profitError = "";
  let effectiveExitPrice = null;

  if (tradeStatus === "exited" && trade.exitedPrice?.length > 0) {
    effectiveExitPrice = parseFloat(trade.exitedPrice[0].price);
  }

  if (tradeStatus === "live") {
    profitError =
      "Trade is live. Add exit price to calculate potential profit.";
  } else if (!effectiveExitPrice && tradeStatus === "exited") {
    profitError = "Exit price required to calculate potential profit.";
  } else if (
    !missingFields.includes("entry") &&
    !missingFields.includes("tradedirection") &&
    effectiveExitPrice
  ) {
    const rewardDiff =
      tradedirection === "sell" || tradedirection === "short"
        ? entry - effectiveExitPrice
        : effectiveExitPrice - entry;
    if (rewardDiff <= 0)
      profitError = tradedirection.includes("buy")
        ? "Exit must be above Entry."
        : "Exit must be below Entry.";
    else {
      const priceDiff = Math.abs(entry - stoploss);
      const positionSize = riskAmount / priceDiff;
      potentialProfit = (rewardDiff * positionSize).toFixed(2);
    }
  }

  // ===== risk amount error =====
  if (riskAmount > trade.accountBalance) {
    lossError = `Risk Amount cannot exceed account balance ($${trade.accountBalance}).`;
    profitError = `Risk Amount cannot exceed account balance ($${trade.accountBalance}).`;
  }

  return (
    <div className={styles.card}>
      <h3>Trade Calculator</h3>

      {generalError && (
        <p style={{ color: "red", fontWeight: "bold" }}>{generalError}</p>
      )}

      <div className={styles.row3}>
        <div className={styles.col2}>
          <p>
            RR: 1:<span>{rr}</span>
          </p>
          {rrError && (
            <p style={{ color: "red", fontSize: "0.9rem" }}>{rrError}</p>
          )}
        </div>

        <div className={styles.col2}>
          <p>
            Potential Loss:{" "}
            <span>{potentialLoss !== "-" ? `$${potentialLoss}` : "-"}</span>
          </p>
          {lossError && (
            <p style={{ color: "red", fontSize: "0.9rem" }}>{lossError}</p>
          )}

          <p>
            Potential Profit:{" "}
            <span>{potentialProfit !== "-" ? `$${potentialProfit}` : "-"}</span>
          </p>
          {profitError && (
            <p style={{ color: "red", fontSize: "0.9rem" }}>{profitError}</p>
          )}
        </div>
      </div>
    </div>
  );
};
