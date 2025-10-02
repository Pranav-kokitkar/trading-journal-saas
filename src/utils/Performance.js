// src/utils/Performance.js
export const calculatePerformance = (trades) => {
  const totalTrades = trades.length;

  const totalLongTrades = trades.filter(
    (t) => t.tradedirection === "long"
  ).length;
  const totalShortTrades = trades.filter(
    (t) => t.tradedirection === "short"
  ).length;

  // Average RR
  let rrSum = 0;
  trades.forEach((t) => {
    if (t.rr) rrSum += Number(t.rr);
  });
  const averageRR = totalTrades ? rrSum / totalTrades : 0;

  // Win / Loss stats
  const totalWins = trades.filter((t) => t.tradeResult === "win").length;
  const totalLosses = trades.filter((t) => t.tradeResult === "loss").length;
  const winRate = totalTrades ? (totalWins / totalTrades) * 100 : 0;

  // Streak calculation
  let currentWinStreak = 0,
    maxWinStreak = 0,
    currentLossStreak = 0,
    maxLossStreak = 0;

  trades.forEach((t) => {
    if (t.tradeResult === "win") {
      currentWinStreak++;
      currentLossStreak = 0;
    } else if (t.tradeResult === "loss") {
      currentLossStreak++;
      currentWinStreak = 0;
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
    if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
  });

  // Total PnL
  const totalPnL = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);

  // Total live trades
  const totalLiveTrades = trades.filter(
    (t) => t.tradeStatus !== "exited"
  ).length;

  // Total Risk
  const totalRisk = trades.reduce(
    (sum, t) => sum + (Number(t.riskamount) || 0),
    0
  );

  // ✅ Extremes
  const balances = trades.map((t) => Number(t.balanceAfterTrade) || 0);
  const pnls = trades.map((t) => Number(t.pnl) || 0);
  const risks = trades.map((t) => Number(t.riskamount) || 0);

  const highestBalance = balances.length > 0 ? Math.max(...balances) : 0;
  const lowestBalance = balances.length > 0 ? Math.min(...balances) : 0;

  const highestWin =
    pnls.length > 0 ? Math.max(...pnls.filter((p) => p > 0)) : 0;
  const lowestLoss =
    pnls.length > 0 ? Math.min(...pnls.filter((p) => p < 0)) : 0;

  const highestRisk = risks.length > 0 ? Math.max(...risks) : 0;
  const lowestRisk = risks.length < 0 ? Math.max(...risks) : 0;

  return {
    totalTrades,
    totalLongTrades,
    totalShortTrades,
    averageRR: Number(averageRR.toFixed(2)),
    totalWins,
    totalLosses,
    winRate: Number(winRate.toFixed(2)),
    maxWinStreak,
    maxLossStreak,
    totalPnL: Number(totalPnL.toFixed(2)),
    totalLiveTrades,
    totalRisk: Number(totalRisk.toFixed(2)),
    highestBalance,
    lowestBalance,
    highestWin,
    lowestLoss,
    highestRisk,
    lowestRisk,
  };
};
