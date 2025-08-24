import styles from "./addtrade.module.css";

export const TradeCalculator = ({ trade }) => {
  const entry = parseFloat(trade.entryPrice) || 0;
  const stoploss = parseFloat(trade.stoplossPrice) || 0;
  const takeprofit = parseFloat(trade.takeProfitPrice) || 0;
  const risk = parseFloat(trade.riskAmount) || 0;
  const marketType = trade.marketType.toLowerCase();
  const tradedirection = trade.tradedirection.toLowerCase();
  const accountBalance = 1000;
  const valuePerUnit = 10; // Only for Forex

  const riskAmount = accountBalance * (risk / 100);
  const stopDistance =
    tradedirection === "long" ? entry - stoploss : stoploss - entry;
  const rewardDistance =
    tradedirection === "long" ? takeprofit - entry : entry - takeprofit;
  const riskRewardRatio = rewardDistance / stopDistance;

  const calculatePositionSize = () => {
    let positionSize;

    switch (marketType) {
      case "forex":
        positionSize = riskAmount / (stopDistance * valuePerUnit);
        break;
      case "crypto":
      case "stocks":
        positionSize = riskAmount / stopDistance;
        break;
      default:
        positionSize = 0;
    }

    return positionSize.toFixed(2);
  };

  const positionSize = calculatePositionSize(); // Call the function

  const calculatePotentialProfit = () => {
    if (!trade.exitedPrice || trade.exitedPrice.length === 0) return 0;

    let totalProfit = 0;

    trade.exitedPrice.forEach((exit) => {
      const exitPrice = parseFloat(exit.price) || 0;
      const volumeFraction = (parseFloat(exit.volume) || 0) / 100; // Convert 50% → 0.5

      let profit = 0;

      if (marketType === "forex") {
        // Forex: use positionSize (lots) * pip difference * valuePerUnit ($ per pip per lot)
        const pipDifference =
          tradedirection === "long" ? exitPrice - entry : entry - exitPrice;
        const units = positionSize * volumeFraction;
        profit = units * pipDifference * valuePerUnit;
      } else {
        // Crypto/Stocks: units = riskAmount / stopDistance
        const units =
          (riskAmount / Math.abs(entry - stoploss)) * volumeFraction;
        const profitPerUnit =
          tradedirection === "long" ? exitPrice - entry : entry - exitPrice;
        profit = units * profitPerUnit;
      }

      totalProfit += profit;
    });

    return totalProfit.toFixed(2);
  };
  const potentialProfit = calculatePotentialProfit(); // FIXED

  const calculateRiskReward = () => {
    if (!trade.exitedPrice || trade.exitedPrice.length === 0) return 0;

    let totalReward = 0;

    trade.exitedPrice.forEach((exit) => {
      const exitPrice = parseFloat(exit.price) || 0;
      const volumeFraction = (parseFloat(exit.volume) || 0) / 100;

      const reward =
        tradedirection === "long" ? exitPrice - entry : entry - exitPrice;

      totalReward += reward * volumeFraction; // weighted average
    });

    const rr = totalReward / Math.abs(stopDistance); // Risk/Reward = Avg Reward / Risk
    return rr.toFixed(2);
  };

  const rr = calculateRiskReward();

  return (
    <div className={styles.card}>
      <h3>Trade Calculator</h3>

      <div className={styles.row3}>
        <div className={styles.col2}>
          <p>
            RR: 1:<span>{rr}</span>
          </p>
        </div>

        <div className={styles.col2}>
          <p>
            Potential Loss: <span>{riskAmount.toFixed(2)}</span>
          </p>
          <p>
            Potential Profit: <span>{potentialProfit}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
