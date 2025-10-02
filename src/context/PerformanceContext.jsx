import { createContext, useState } from "react";
import { calculatePerformance } from "../utils/Performance";

export const PerformanceContext = createContext();

const emptyPerformance = {
  averageRR: 0,
  totalTrades: 0,
  totalLongTrades: 0,
  totalShortTrades: 0,
  totalWins: 0,
  totalLosses: 0,
  winRate: 0,
  maxWinStreak: 0,
  maxLossStreak: 0,
  totalPnL: 0,
  totalLiveTrades: 0,
  totalRisk: 0,
  highestBalance: 0,
  lowestBalance: 0,
  highestWin: 0,
  lowestLoss: 0,
  highestRisk: 0,
  lowestRisk: 0,
};

export const PerformanceProvider = ({ children }) => {
  const [performance, setPerformance] = useState(() => {
    const trades = JSON.parse(localStorage.getItem("trades")) || [];
    return trades.length > 0 ? calculatePerformance(trades) : emptyPerformance;
  });

  const refreshPerformance = () => {
    const trades = JSON.parse(localStorage.getItem("trades")) || [];
    const newPerformance =
      trades.length > 0 ? calculatePerformance(trades) : emptyPerformance;

    setPerformance(newPerformance);
    localStorage.setItem("performance", JSON.stringify(newPerformance));
  };

  return (
    <PerformanceContext.Provider
      value={{ performance, setPerformance, refreshPerformance }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};
