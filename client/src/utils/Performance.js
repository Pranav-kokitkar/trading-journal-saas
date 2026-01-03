// src/utils/Performance.js
export const calculatePerformance = (trades = []) => {
  // Ensure we always work with an array
  const allTrades = Array.isArray(trades) ? trades : [];

  // Treat "closed" and "exited" as finished trades
  const isClosedStatus = (s) =>
    typeof s === "string" &&
    ["closed", "exited"].includes(s.toString().toLowerCase());

  // Split into closed/exited and live/other
  const closedTrades = allTrades.filter((t) => isClosedStatus(t.tradeStatus));
  const liveTrades = allTrades.filter((t) => !isClosedStatus(t.tradeStatus));

  // Helper: read a value with flexible field names / casing
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

  // Closed trades count
  const totalTrades = closedTrades.length;

  // Direction stats
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

  // Average RR (wins only)
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

  // Win / loss counts (closed)
  const totalWins = closedWinTrades.length;

  const closedLossTrades = closedTrades.filter(
    (t) => String(read(t, "tradeResult") || "").toLowerCase() === "loss"
  );

  const totalLosses = closedLossTrades.length;

  // Win rate in %
  const winRate =
    totalWins + totalLosses > 0
      ? (totalWins / (totalWins + totalLosses)) * 100
      : 0;

  // Streaks (closed trades sorted by time)
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
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
    if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
  });

  // Total PnL (closed)
  const totalPnL = closedTrades.reduce((sum, t) => {
    const raw = read(t, "pnl");
    const n = raw === undefined || raw === null ? 0 : Number(raw);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  // Live trades count
  const totalLiveTrades = liveTrades.length;

  // Total risk (closed)
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

  const positivePnls = pnls.filter((p) => p > 0);
  const highestWin = positivePnls.length > 0 ? Math.max(...positivePnls) : 0;

  const negativePnls = pnls.filter((p) => p < 0);
  const lowestLoss = negativePnls.length > 0 ? Math.min(...negativePnls) : 0;

  const highestRisk = risks.length > 0 ? Math.max(...risks) : 0;
  const lowestRisk = risks.length > 0 ? Math.min(...risks) : 0;

  /* ===========================
     EXPECTANCY (NEW — CLOSED ONLY)
     =========================== */

  // Avg Win RR
  let winRRSum = 0;
  closedWinTrades.forEach((t) => {
    const n = Number(read(t, "rr"));
    if (!isNaN(n)) winRRSum += n;
  });
  const avgWinRR =
    closedWinTrades.length > 0 ? winRRSum / closedWinTrades.length : 0;

  // Avg Loss RR (absolute)
  let lossRRSum = 0;
  closedLossTrades.forEach((t) => {
    const n = Math.abs(Number(read(t, "rr")));
    if (!isNaN(n)) lossRRSum += n;
  });
  const avgLossRR =
    closedLossTrades.length > 0 ? lossRRSum / closedLossTrades.length : 0;

  const lossRate =
    totalWins + totalLosses > 0 ? totalLosses / (totalWins + totalLosses) : 0;

  const expectancyRR = (winRate / 100) * avgWinRR - lossRate * avgLossRR;

  const expectancyPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;

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
    expectancyRR: Number(expectancyRR.toFixed(2)),
    expectancyPnL: Number(expectancyPnL.toFixed(2)),
  };
};
