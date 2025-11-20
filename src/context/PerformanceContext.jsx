// src/context/PerformanceContext.jsx
import React, { createContext, useEffect, useMemo } from "react";
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
};

export const PerformanceProvider = ({ children }) => {
  // read trades from TradeContext (assumes TradeProvider is mounted above this)
  const { trades } = useTrades();

  // ✅ derive performance directly from current trades, no extra state
  const performance = useMemo(() => {
    try {
      const safeTrades = Array.isArray(trades) ? [...trades] : [];
      if (safeTrades.length > 0) {
        return calculatePerformance(safeTrades);
      }
      return emptyPerformance;
    } catch (e) {
      console.error("PerformanceProvider calculation error:", e);
      return emptyPerformance;
    }
  }, [trades]);

  // still persist, but we don't read from localStorage anymore
  useEffect(() => {
    try {
      localStorage.setItem("performance", JSON.stringify(performance));
    } catch (e) {
      console.error("Failed to persist performance:", e);
    }
  }, [performance]);

  // Manual refresh is basically a no-op now, kept for compatibility
  const refreshPerformance = () => {
    console.log(
      "refreshPerformance called — performance is already derived from latest trades."
    );
  };

  return (
    <PerformanceContext.Provider value={{ performance, refreshPerformance }}>
      {children}
    </PerformanceContext.Provider>
  );
};
