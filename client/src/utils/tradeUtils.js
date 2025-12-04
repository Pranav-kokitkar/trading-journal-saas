export const calculateTradeOnExit = ({
  trade,
  exitLevels,
  accountBalance = 10000,
}) => {
  if (!trade) return null;

  // Build a normalized updated trade
  const updatedTrade = {
    ...trade,
    tradeStatus: "exited",
    exitedPrice: exitLevels,
  };

  const entry = Number(updatedTrade.entryPrice) || 0;
  const stoploss = Number(updatedTrade.stoplossPrice) || 0;
  const takeprofit = Number(updatedTrade.takeProfitPrice) || 0;

  // Normalize direction: accept both tradeDirection and tradedirection
  const tradedirection = (
    (updatedTrade.tradeDirection ?? updatedTrade.tradedirection) ||
    ""
  )
    .toString()
    .toLowerCase()
    .trim();

  const riskAmount = Number(updatedTrade.riskAmount) || 0;
  const riskType = updatedTrade.riskType || "dollar";

  // Actual Risk
  const actualRisk =
    riskType === "percent" ? (riskAmount / 100) * accountBalance : riskAmount;

  // ===== RR Calculation (weighted exit) =====
  let rr = 0;
  if (
    tradedirection &&
    entry &&
    stoploss &&
    Array.isArray(exitLevels) &&
    exitLevels.length > 0
  ) {
    let weightedExit = 0;
    let totalVolume = 0;

    exitLevels.forEach((lvl) => {
      const price = Number(lvl.price) || 0;
      const volumePercent = Number(lvl.volume) || 0;
      weightedExit += price * volumePercent;
      totalVolume += volumePercent;
    });

    weightedExit = totalVolume ? weightedExit / totalVolume : takeprofit;

    // avoid division by zero
    const denomShort = Number(stoploss) - Number(entry);
    const denomLong = Number(entry) - Number(stoploss);

    if (tradedirection === "short" || tradedirection === "sell") {
      rr = denomShort !== 0 ? (entry - weightedExit) / denomShort : 0;
    } else {
      rr = denomLong !== 0 ? (weightedExit - entry) / denomLong : 0;
    }

    rr = parseFloat(rr.toFixed(2));
  }

  // Risk Amount
  const priceDiff = Math.abs(entry - stoploss);
  const riskamount = priceDiff > 0 ? parseFloat(actualRisk.toFixed(2)) : 0;

  // PnL Calculation (volume-aware)
  let pnl = 0;
  if (priceDiff > 0) {
    exitLevels.forEach((lvl) => {
      const exitPrice = Number(lvl.price);
      const volumePercent = Number(lvl.volume) / 100;
      const rewardDiff =
        tradedirection === "short" || tradedirection === "sell"
          ? entry - exitPrice
          : exitPrice - entry;
      const positionSize = actualRisk / priceDiff;
      pnl += rewardDiff * positionSize * volumePercent;
    });
  } else {
    pnl = 0;
  }

  // cap extreme loss
  if (pnl < 0 && Math.abs(pnl) > accountBalance) pnl = -accountBalance;
  pnl = parseFloat(pnl.toFixed(2));

  // Set tradeResult for performance calculation
  const tradeResult = pnl >= 0 ? "win" : "loss";

  // Update balance after this trade
  const balanceAfterTrade = parseFloat((accountBalance + pnl).toFixed(2));

  return {
    ...updatedTrade,
    rr,
    riskamount,
    pnl,
    tradeResult,
    balanceAfterTrade,
  };
};
export const calculateTradeValues = ({ trade, accountBalance }) => {
  const entry = Number(trade.entryPrice) || 0;
  const stoploss = Number(trade.stoplossPrice) || 0;
  const takeprofit = Number(trade.takeProfitPrice) || 0;

  // Normalize direction (both field names)
  const tradedirection = ((trade.tradeDirection ?? trade.tradedirection) || "")
    .toString()
    .toLowerCase()
    .trim();

  const marketType = (trade.marketType || "").toString().toLowerCase();
  const riskAmount = Number(trade.riskAmount) || 0;
  const tradeStatus = trade.tradeStatus || "";
  const symbol = (trade.symbol || "").toString().toUpperCase();
  const riskType = trade.riskType || "dollar";

  const requiredFields = {
    entry,
    stoploss,
    tradedirection,
    marketType,
    riskAmount,
    tradeStatus,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([_, val]) => !val)
    .map(([key]) => key);

  const generalError = missingFields.length
    ? "Fill all above details to see the results."
    : "";

  // ===== RR calculation (only for exited trades) =====
  let rr = 0;
  let rrError = "";

  if (
    !missingFields.includes("entry") &&
    !missingFields.includes("stoploss") &&
    !missingFields.includes("tradedirection") &&
    tradeStatus === "exited" &&
    (takeprofit || (trade.exitedPrice && trade.exitedPrice.length > 0))
  ) {
    const rrExit =
      trade.exitedPrice?.length > 0
        ? Number(trade.exitedPrice[0].price)
        : takeprofit;

    if (tradedirection === "buy" || tradedirection === "long") {
      rrError =
        entry <= stoploss ? "Entry must be above Stoploss for Buy trades." : "";
      rr = rrError ? 0 : ((rrExit - entry) / (entry - stoploss)).toFixed(2);
    } else if (tradedirection === "sell" || tradedirection === "short") {
      rrError =
        entry >= stoploss
          ? "Entry must be below Stoploss for Sell trades."
          : "";
      rr = rrError ? 0 : ((entry - rrExit) / (stoploss - entry)).toFixed(2);
    } else rrError = "Unknown trade direction.";
  }

  // ===== Adjust risk amount based on $ / % =====
  let actualRisk = Number(riskAmount);
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
    let calculatedLoss = actualRisk;

    if (marketType === "forex") {
      const pipSize = symbol.includes("JPY") ? 0.01 : 0.0001;
      const pips = priceDiff / pipSize;
      if (pips <= 0) lossError = "Invalid Entry/Stoploss for Forex.";
    }

    if (!lossError) {
      if (calculatedLoss > accountBalance) calculatedLoss = accountBalance;
      riskamount = calculatedLoss.toFixed(2);
      if (actualRisk > accountBalance) {
        lossError = `Risk cannot exceed account balance ($${accountBalance}).`;
      } else if (actualRisk > 0.2 * accountBalance) {
        lossWarning = "Warning: Risk exceeds 20% of account balance.";
      }
    }
  } else if (!lossError && !missingFields.includes("marketType")) {
    lossError = "Enter Entry, Stoploss, and Risk Amount.";
  }

  // ===== Potential Profit / PNL =====
  let pnl = "-";
  let profitError = "";

  if (tradeStatus === "live") {
    profitError =
      "Trade is live. Add exit price to calculate potential profit.";
  } else if (tradeStatus === "exited" && trade.exitedPrice?.length > 0) {
    const totalVolume = trade.exitedPrice.reduce(
      (sum, lvl) => sum + Number(lvl.volume || 0),
      0
    );

    if (totalVolume !== 100) {
      profitError = "Total exit volume must equal 100%";
    } else {
      let totalProfit = 0;
      const priceDiff = Math.abs(entry - stoploss);
      if (priceDiff > 0) {
        trade.exitedPrice.forEach((lvl) => {
          const exitPrice = Number(lvl.price);
          const volumePercent = Number(lvl.volume) / 100;
          const rewardDiff =
            tradedirection === "sell" || tradedirection === "short"
              ? entry - exitPrice
              : exitPrice - entry;
          const positionSize = actualRisk / priceDiff;
          totalProfit += rewardDiff * positionSize * volumePercent;
        });
      }

      if (totalProfit < 0 && Math.abs(totalProfit) > accountBalance) {
        pnl = (-accountBalance).toFixed(2);
        profitError = "Loss capped at account balance.";
      } else {
        pnl = totalProfit.toFixed(2);
        if (totalProfit < 0 && Math.abs(totalProfit) > 0.2 * accountBalance) {
          lossWarning = "Warning: Loss exceeds 20% of account balance.";
        }
      }
    }
  } else {
    profitError = "Exit price required to calculate potential profit.";
  }

  return {
    rr: parseFloat(rr) || 0,
    rrError,
    riskamount: parseFloat(riskamount) || 0,
    lossError,
    lossWarning,
    pnl: parseFloat(pnl) || 0,
    profitError,
    generalError,
  };
};
