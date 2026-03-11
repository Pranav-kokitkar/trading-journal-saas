/**
 * Format metric value, return "—" for zero, null, undefined, or infinity
 */
export const formatMetricValue = (value) => {
  if (value === null || value === undefined || value === 0 || value >= 999) {
    return "—";
  }
  return value;
};

/**
 * Merge equity curve data from two datasets
 */
export const mergeEquityCurveData = (datasetA, datasetB) => {
  const dataA = datasetA?.chartData?.equityCurve || [];
  const dataB = datasetB?.chartData?.equityCurve || [];

  const maxTradeCount = Math.max(
    dataA.length > 0 ? dataA[dataA.length - 1].tradeNumber : 0,
    dataB.length > 0 ? dataB[dataB.length - 1].tradeNumber : 0
  );

  const merged = [];
  for (let i = 1; i <= maxTradeCount; i++) {
    const pointA = dataA.find((d) => d.tradeNumber === i);
    const pointB = dataB.find((d) => d.tradeNumber === i);

    merged.push({
      tradeNumber: i,
      datasetA: pointA ? pointA.cumulativePnL : null,
      datasetB: pointB ? pointB.cumulativePnL : null,
    });
  }

  return merged;
};

/**
 * Merge expectancy data from two datasets
 */
export const mergeExpectancyData = (datasetA, datasetB) => {
  const dataA = datasetA?.chartData?.expectancyProgression || [];
  const dataB = datasetB?.chartData?.expectancyProgression || [];

  const maxTradeCount = Math.max(
    dataA.length > 0 ? dataA[dataA.length - 1].tradeNumber : 0,
    dataB.length > 0 ? dataB[dataB.length - 1].tradeNumber : 0
  );

  const merged = [];
  for (let i = 1; i <= maxTradeCount; i++) {
    const pointA = dataA.find((d) => d.tradeNumber === i);
    const pointB = dataB.find((d) => d.tradeNumber === i);

    merged.push({
      tradeNumber: i,
      datasetA: pointA ? pointA.expectancy : null,
      datasetB: pointB ? pointB.expectancy : null,
    });
  }

  return merged;
};

/**
 * Get dimension label for display
 */
export const getDimensionLabel = (key, value, accounts, strategies, tags) => {
  if (!value) return "Not selected";

  switch (key) {
    case "accountId":
      const account = accounts.find((acc) => acc._id === value);
      return account ? account.name : value;

    case "strategy":
      const strategy = strategies.find((strat) => strat._id === value);
      return strategy ? strategy.name : value;

    case "tag":
      const tag = tags.find((t) => t._id === value);
      return tag ? tag.name : value;

    case "direction":
      return value.toUpperCase();

    case "tradeStatus":
      return value === "live" ? "Live (Ongoing)" : "Exited (Completed)";

    case "marketType":
      return value.charAt(0).toUpperCase() + value.slice(1);

    default:
      return value;
  }
};
