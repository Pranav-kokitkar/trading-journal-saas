// src/utils/Performance.js
export const calculatePerformance = (trades = []) => {
  // Defensive: ensure trades is an array
  const allTrades = Array.isArray(trades) ? trades : [];

  // Accept both "closed" and "exited" as finished trades (case-insensitive)
  const isClosedStatus = (s) =>
    typeof s === "string" &&
    ["closed", "exited"].includes(s.toString().toLowerCase());

  // Partition trades: closed/exited vs live/other
  const closedTrades = allTrades.filter((t) => isClosedStatus(t.tradeStatus));
  const liveTrades = allTrades.filter((t) => !isClosedStatus(t.tradeStatus));

  // helper to read fields with flexible casing
  const read = (t, ...keys) => {
    for (const k of keys) {
      if (t == null) continue;
      if (Object.prototype.hasOwnProperty.call(t, k)) return t[k];
      const lower = k.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(t, lower)) return t[lower];
      const alt = Object.keys(t).find(
        (x) => x.toLowerCase() === k.toLowerCase()
      );
      if (alt) return t[alt];
    }
    return undefined;
  };

  // total closed trades
  const totalTrades = closedTrades.length;

  // directions (support tradeDirection / tradedirection)
  const totalLongTrades = closedTrades.filter(
    (t) =>
      String(
        read(t, "tradeDirection", "tradedirection") || ""
      ).toLowerCase() === "long"
  ).length;

  const totalShortTrades = closedTrades.filter(
    (t) =>
      String(
        read(t, "tradeDirection", "tradedirection") || ""
      ).toLowerCase() === "short"
  ).length;

  // -----------------------------
  // AVERAGE RR: now only from WIN trades
  // -----------------------------
  const closedWinTrades = closedTrades.filter(
    (t) => String(read(t, "tradeResult") || "").toLowerCase() === "win"
  );

  let rrSum = 0;
  let rrCount = 0;
  closedWinTrades.forEach((t) => {
    const raw = read(t, "rr");
    const num = raw === undefined || raw === null ? NaN : Number(raw);
    if (!isNaN(num)) {
      rrSum += num;
      rrCount++;
    }
  });
  const averageRR = rrCount > 0 ? rrSum / rrCount : 0;

  // Win / Loss stats (closed trades)
  const totalWins = closedWinTrades.length;

  const totalLosses = closedTrades.filter(
    (t) => String(read(t, "tradeResult") || "").toLowerCase() === "loss"
  ).length;

  // Win rate: wins / (wins + losses) * 100
  const winRate =
    totalWins + totalLosses > 0
      ? (totalWins / (totalWins + totalLosses)) * 100
      : 0;

  // Streak calculation (iterate closed trades in chronological order)
  const sortedClosed = closedTrades.slice().sort((a, b) => {
    const da = new Date(read(a, "dateTime", "dateNtime")).getTime() || 0;
    const db = new Date(read(b, "dateTime", "dateNtime")).getTime() || 0;
    return da - db;
  });

  let currentWinStreak = 0,
    maxWinStreak = 0,
    currentLossStreak = 0,
    maxLossStreak = 0;

  sortedClosed.forEach((t) => {
    const res = String(read(t, "tradeResult") || "").toLowerCase();
    if (res === "win") {
      currentWinStreak++;
      currentLossStreak = 0;
    } else if (res === "loss") {
      currentLossStreak++;
      currentWinStreak = 0;
    } else {
      // breakeven or other result breaks streaks
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
    if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
  });

  // Total PnL (sum of pnl from closed trades)
  const totalPnL = closedTrades.reduce((sum, t) => {
    const raw = read(t, "pnl");
    const n = raw === undefined || raw === null ? 0 : Number(raw);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  // Total live trades — use live partition length
  const totalLiveTrades = liveTrades.length;

  // Total Risk (sum riskAmount / riskamount) for closed trades
  const totalRisk = closedTrades.reduce((sum, t) => {
    const raw = read(t, "riskAmount", "riskamount");
    const n = raw === undefined || raw === null ? 0 : Number(raw);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  // Extremes from closed trades
  const balances = closedTrades
    .map((t) => {
      const raw = read(t, "balanceAfterTrade");
      const n = raw === undefined || raw === null ? NaN : Number(raw);
      return isNaN(n) ? null : n;
    })
    .filter((x) => x !== null);

  const pnls = closedTrades
    .map((t) => {
      const raw = read(t, "pnl");
      const n = raw === undefined || raw === null ? NaN : Number(raw);
      return isNaN(n) ? null : n;
    })
    .filter((x) => x !== null);

  const risks = closedTrades
    .map((t) => {
      const raw = read(t, "riskAmount", "riskamount");
      const n = raw === undefined || raw === null ? NaN : Number(raw);
      return isNaN(n) ? null : n;
    })
    .filter((x) => x !== null);

  const highestBalance = balances.length > 0 ? Math.max(...balances) : 0;
  const lowestBalance = balances.length > 0 ? Math.min(...balances) : 0;

  const highestWin =
    pnls.length > 0 ? Math.max(...pnls.filter((p) => p > 0)) : 0;
  const lowestLoss =
    pnls.length > 0 ? Math.min(...pnls.filter((p) => p < 0)) : 0;

  const highestRisk = risks.length > 0 ? Math.max(...risks) : 0;
  const lowestRisk = risks.length > 0 ? Math.min(...risks) : 0;

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
