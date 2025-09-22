// src/utils/Performance.js
export const calculatePerformance = (trades) => {
  const totalTrades = trades.length; // ✅ singular naming corrected
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
  };
};
