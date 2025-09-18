import { useContext, useEffect } from "react";
import styles from "./addtrade.module.css";
import { AccountContext } from "../../../context/AccountContext";

export const TradeCalculator = ({ trade, setTrade }) => {
  const entry = parseFloat(trade.entryPrice) || 0;
  const stoploss = parseFloat(trade.stoplossPrice) || 0;
  const takeprofit = parseFloat(trade.takeProfitPrice) || 0;
  const tradedirection = (trade.tradedirection || "").toLowerCase();
  const marketType = (trade.marketType || "").toLowerCase();
  const riskAmount = parseFloat(trade.riskAmount) || 0;
  const tradeStatus = trade.tradeStatus || "";
  const symbol = (trade.symbol || "").toUpperCase();
  const riskType = trade.riskType || "dollar";

  const { accountDetails } = useContext(AccountContext);
  const accountBalance = accountDetails?.balance || 0;

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

  // ===== Adjust risk amount based on $ / % =====
  let actualRisk = riskAmount;
  if (riskType === "percent" && accountBalance) {
    actualRisk = (riskAmount / 100) * accountBalance;
  }

  // ===== Potential Loss =====
  let riskamount = "-";
  let lossError = "";
  let lossWarning = "";
  if (
    !missingFields.includes("entry") &&
    !missingFields.includes("stoploss") &&
    !missingFields.includes("riskAmount") &&
    marketType
  ) {
    const priceDiff = Math.abs(entry - stoploss);
    if (marketType === "crypto" || marketType === "stocks") {
      let calculatedLoss = actualRisk;
      if (calculatedLoss > accountBalance) calculatedLoss = accountBalance;
      riskamount = calculatedLoss.toFixed(2);

      if (actualRisk > accountBalance) {
        lossError = `Risk cannot exceed account balance ($${accountBalance}).`;
      } else if (actualRisk > 0.2 * accountBalance) {
        lossWarning = "Warning: Risk exceeds 20% of account balance.";
      }
    } else if (marketType === "forex") {
      const pipSize = symbol.includes("JPY") ? 0.01 : 0.0001;
      const pips = priceDiff / pipSize;
      if (pips <= 0) lossError = "Invalid Entry/Stoploss for Forex.";
      else {
        let calculatedLoss = actualRisk;
        if (calculatedLoss > accountBalance) calculatedLoss = accountBalance;
        riskamount = calculatedLoss.toFixed(2);

        if (actualRisk > accountBalance) {
          lossError = `Risk cannot exceed account balance ($${accountBalance}).`;
        } else if (actualRisk > 0.2 * accountBalance) {
          lossWarning = "Warning: Risk exceeds 20% of account balance.";
        }
      }
    } else lossError = "Unsupported market type.";
  } else if (!lossError && !missingFields.includes("marketType")) {
    lossError = "Enter Entry, Stoploss, and Risk Amount.";
  }

  // ===== Potential Profit =====
  let pnl = "-";
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

    const priceDiff = Math.abs(entry - stoploss);
    const positionSize = actualRisk / priceDiff;

    let rawProfit = rewardDiff * positionSize;

    // ===== Cap negative profit at account balance =====
    if (rawProfit < 0 && Math.abs(rawProfit) > accountBalance) {
      pnl = (-accountBalance).toFixed(2);
      profitError = "Loss capped at account balance.";
    } else {
      pnl = rawProfit.toFixed(2);
      if (rawProfit < 0 && Math.abs(rawProfit) > 0.2 * accountBalance) {
        lossWarning = "Warning: Loss exceeds 20% of account balance.";
      }
    }
  }

  useEffect(() => {
    if (setTrade) {
      setTrade((prev) => ({
        ...prev,
        pnl: parseFloat(pnl) || 0,
        riskamount: parseFloat(riskamount) || 0,
        rr: parseFloat(rr) ||0,
      }));
    }
  }, [pnl, riskamount,rr]);

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
            Risk Amount:{" "}
            <span>{riskamount !== "-" ? `$${riskamount}` : "-"}</span>
          </p>
          {lossError && (
            <p style={{ color: "red", fontSize: "0.9rem" }}>{lossError}</p>
          )}
          {lossWarning && (
            <p style={{ color: "orange", fontSize: "0.9rem" }}>{lossWarning}</p>
          )}

          <p>
            PNL:{" "}
            <span>{pnl !== "-" ? `$${pnl}` : "-"}</span>
          </p>
          {profitError && (
            <p style={{ color: "red", fontSize: "0.9rem" }}>{profitError}</p>
          )}
          {lossWarning && (
            <p style={{ color: "orange", fontSize: "0.9rem" }}>{lossWarning}</p>
          )}
        </div>
      </div>
    </div>
  );
};
