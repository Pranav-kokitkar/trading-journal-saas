// src/context/PerformanceContext.jsx
import React, { createContext, useEffect, useState } from "react";
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

  // initialize from trades (if available), otherwise fall back to persisted performance or empty
  const [performance, setPerformance] = useState(() => {
    try {
      if (Array.isArray(trades) && trades.length > 0) {
        return calculatePerformance(trades);
      }
      const persisted = localStorage.getItem("performance");
      return persisted ? JSON.parse(persisted) : emptyPerformance;
    } catch (e) {
      console.error("PerformanceProvider init error:", e);
      return emptyPerformance;
    }
  });

  // recompute whenever trades change
  useEffect(() => {
    try {
      const newPerformance =
        Array.isArray(trades) && trades.length > 0
          ? calculatePerformance(trades)
          : emptyPerformance;
      setPerformance(newPerformance);
      // persist so other parts of app (if any) can still read it from localStorage
      localStorage.setItem("performance", JSON.stringify(newPerformance));
    } catch (e) {
      console.error("Failed to calculate performance on trades update:", e);
    }
  }, [trades]);

  // manual refresh (now uses current trades from context)
  const refreshPerformance = () => {
    try {
      const newPerformance =
        Array.isArray(trades) && trades.length > 0
          ? calculatePerformance(trades)
          : emptyPerformance;
      setPerformance(newPerformance);
      localStorage.setItem("performance", JSON.stringify(newPerformance));
    } catch (e) {
      console.error("refreshPerformance error:", e);
    }
  };

  return (
    <PerformanceContext.Provider
      value={{ performance, setPerformance, refreshPerformance }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};
