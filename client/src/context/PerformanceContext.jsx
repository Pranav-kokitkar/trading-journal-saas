// src/context/PerformanceContext.jsx
import React, { createContext, useMemo } from "react";
import { calculatePerformance } from "../utils/Performance";
import { useTrades } from "../store/TradeContext";

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
  expectancyRR: 0,
  expectancyPnL: 0,
};

export const PerformanceProvider = ({ children }) => {
  const { accountTrades } = useTrades();

  // derive performance directly from trades
  const performance = useMemo(() => {
    try {
      const safeTrades = Array.isArray(accountTrades) ? accountTrades : [];
      if (safeTrades.length > 0) {
        return calculatePerformance(safeTrades);
      }
      return emptyPerformance;
    } catch (err) {
      console.error("Performance calculation error:", err);
      return emptyPerformance;
    }
  }, [accountTrades]);


  return (
    <PerformanceContext.Provider value={{ performance}}>
      {children}
    </PerformanceContext.Provider>
  );
};
