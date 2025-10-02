// src/utils/tradeUtils.js

export const calculateTradeOnExit = ({
  trade,
  exitLevels,
  accountBalance = 10000,
}) => {
  if (!trade) return null;

  const updatedTrade = {
    ...trade,
    tradeStatus: "exited",
    exitedPrice: exitLevels,
  };

  // Parse numbers
  const entry = parseFloat(updatedTrade.entryPrice) || 0;
  const stoploss = parseFloat(updatedTrade.stoplossPrice) || 0;
  const takeprofit = parseFloat(updatedTrade.takeProfitPrice) || 0;
  const tradedirection = (updatedTrade.tradedirection || "").toLowerCase();
  const marketType = (updatedTrade.marketType || "").toLowerCase();
  const riskAmount = parseFloat(updatedTrade.riskAmount) || 0;
  const riskType = updatedTrade.riskType || "dollar";
  const symbol = (updatedTrade.symbol || "").toUpperCase();

  // ===== Actual Risk =====
  const actualRisk =
    riskType === "percent" ? (riskAmount / 100) * accountBalance : riskAmount;

  // ===== RR =====
  let rr = 0;
  if (
    tradedirection &&
    entry &&
    stoploss &&
    updatedTrade.exitedPrice.length > 0
  ) {
    const rrExit = parseFloat(updatedTrade.exitedPrice[0].price) || takeprofit;
    if (tradedirection === "long" || tradedirection === "buy") {
      rr = ((rrExit - entry) / (entry - stoploss)).toFixed(2);
    } else {
      rr = ((entry - rrExit) / (stoploss - entry)).toFixed(2);
    }
  }

  // ===== Risk Amount for Trade =====
  const priceDiff = Math.abs(entry - stoploss);
  const riskamount = priceDiff > 0 ? actualRisk.toFixed(2) : "0";

  // ===== PNL Calculation =====
  let pnl = 0;
  updatedTrade.exitedPrice.forEach((lvl) => {
    const exitPrice = parseFloat(lvl.price);
    const volumePercent = parseFloat(lvl.volume) / 100;
    const rewardDiff =
      tradedirection === "short" ? entry - exitPrice : exitPrice - entry;
    const positionSize = actualRisk / priceDiff;
    pnl += rewardDiff * positionSize * volumePercent;
  });
  pnl = pnl.toFixed(2);

  // ===== Update trade object =====
  return {
    ...updatedTrade,
    rr: parseFloat(rr),
    riskamount: parseFloat(riskamount),
    pnl: parseFloat(pnl),
  };
};
