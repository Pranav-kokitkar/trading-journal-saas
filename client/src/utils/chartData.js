// Equity Curve
export const getEquityCurveData = (trades) => {
  const sortedTrades = [...(trades || [])].sort((a, b) => {
    const tradeNumberA = Number(a?.tradeNumber);
    const tradeNumberB = Number(b?.tradeNumber);

    if (Number.isFinite(tradeNumberA) && Number.isFinite(tradeNumberB)) {
      return tradeNumberA - tradeNumberB;
    }

    return new Date(a?.dateTime || 0) - new Date(b?.dateTime || 0);
  });

  return sortedTrades.map((t) => ({
    x: t.tradeNumber,
    y: parseFloat(t.balanceAfterTrade),
  }));
};

// Win vs Loss Pie
export const getWinLossData = (trades) => {
  const wins = trades.filter((t) => t.tradeResult === "win").length;
  const losses = trades.filter((t) => t.tradeResult === "loss").length;
  const breakeven = trades.filter((t) => t.tradeResult === "breakeven").length;

  return [
    { name: "Win", value: wins },
    { name: "Loss", value: losses },
    { name: "Breakeven", value: breakeven },
  ];
};

// Profit/Loss per Trade
export const getPnLPerTrade = (trades) => {
  return trades.map((t) => ({
    x: t.tradeNumber,
    y: parseFloat(t.pnl),
  }));
};

// Risk Amount per Trade
export const getRiskData = (trades) => {
  return trades.map((t) => ({
    x: t.tradeNumber,
    y: parseFloat(t.riskamount),
  }));
};

// Trade Direction Success Rate
export const getDirectionSuccessData = (trades) => {
  const longs = trades.filter((t) => t.tradedirection === "long");
  const shorts = trades.filter((t) => t.tradedirection === "short");

  const longWins = longs.filter((t) => t.tradeResult === "win").length;
  const shortWins = shorts.filter((t) => t.tradeResult === "win").length;

  return [
    { name: "Long", value: longs.length ? (longWins / longs.length) * 100 : 0 },
    {
      name: "Short",
      value: shorts.length ? (shortWins / shorts.length) * 100 : 0,
    },
  ];
};
