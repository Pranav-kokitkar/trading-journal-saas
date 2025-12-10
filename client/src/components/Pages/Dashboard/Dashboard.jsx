// src/components/Pages/Dashboard/Dashboard.jsx
import React, { useContext, useState, useEffect } from "react";
import styles from "./dashboard.module.css";
import EquityCurveChart from "./EquityCurveChart";
import WinLossChart from "./WinLossChart";
import PnLChart from "./PnLChart";
import RiskChart from "./RiskChart";
import DirectionChart from "./DirectionChart";

import { PerformanceContext } from "../../../context/PerformanceContext";
import { useTrades } from "../../../store/TradeContext"; 

import { FiActivity, FiTrendingUp, FiTarget } from "react-icons/fi";
import { FaTrophy, FaPercentage } from "react-icons/fa";
import { CreateAccModal } from "../../Layout/CreateAccModal";
import { UserContext } from "../../../context/UserContext";
import { AccountContext } from "../../../context/AccountContext";
import { useAuth } from "../../../store/Auth";

export const Dashboard = () => {
  const { userDetails } = useContext(UserContext);
  const { performance } = useContext(PerformanceContext);
  const {accountDetails} = useContext(AccountContext);
  const [IsCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Read trades from TradeContext (fallback to empty array)
  const { trades = [] } = useTrades() || {};
  const { accountTrades = [] } = useTrades() || {};
  const {isAdmin} = useAuth();
  console.log(isAdmin);

  // Accept both "closed" and "exited" as finished trades (case-insensitive)
  const finishedStatuses = new Set(["closed", "exited"]);

  // Filter closed/exited trades only for charts and performance-sensitive visuals
  const closedTrades = Array.isArray(accountTrades)
    ? accountTrades.filter((t) =>
        finishedStatuses.has(String(t.tradeStatus || "").toLowerCase())
      )
    : [];

  useEffect(() => {
    if (userDetails && userDetails.activeAccountId == null) {
      setIsCreateModalOpen(true);
    }
  }, [userDetails]);

  if (!userDetails) {
    return <p>loading...</p>;
  }

  return (
    <section className={styles.dashboard}>
      <TradingDashboard accountDetails={accountDetails} performance={performance} />

      <h1>
        Trading <span className={styles.span}>Performance</span>{" "}
      </h1>
      <div className={styles.tradingperformance}>
        <div className={styles.chartCard}>
          <h3>Equity Curve</h3>
          <EquityCurveChart trades={closedTrades} />
        </div>

        <div className={styles.chartCard}>
          <h3>Win / Loss</h3>
          <WinLossChart trades={closedTrades} />
        </div>

        <div className={styles.chartCard}>
          <h3>PnL Per Trade</h3>
          <PnLChart trades={closedTrades} />
        </div>

        <div className={styles.chartCard}>
          <h3>Risk Overview</h3>
          <RiskChart trades={closedTrades} />
        </div>

        <div className={styles.chartCard}>
          <h3>Direction Success</h3>
          <DirectionChart trades={closedTrades} />
        </div>
      </div>

      {IsCreateModalOpen && (
        <CreateAccModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </section>
  );
};

const TradingDashboard = ({ accountDetails, performance }) => {
  return (
    <div>
      <h1>
        Trading <span className={styles.span}>Dashboard</span>
      </h1>
      <div className={styles.tradingdata}>
        {/* Left side */}
        <div className={styles.tradingdatal}>
          <h3>
            <FiActivity className={`${styles.icon} ${styles.iconBlue}`} />
            Total Trades:{" "}
            <span className={styles.blue}>{performance.totalTrades}</span>
          </h3>

          <h3>
            <FaTrophy className={`${styles.icon} ${styles.iconGreen}`} />
            Win Rate:{" "}
            <span
              className={
                performance.totalPnL > 0
                  ? styles.profit
                  : performance.totalPnL < 0
                  ? styles.loss
                  : styles.neutral
              }
            >
              {performance.winRate}%
            </span>
          </h3>

          <h3>
            <FiTrendingUp className={`${styles.icon} ${styles.iconGreen}`} />
            Total PnL:{" "}
            <span
              className={
                performance.totalPnL > 0
                  ? styles.profit
                  : performance.totalPnL < 0
                  ? styles.loss
                  : styles.neutral
              }
            >
              ${performance.totalPnL}
            </span>
          </h3>

          <h3>
            <FiTarget className={`${styles.icon} ${styles.iconYellow}`} />
            Average RR:{" "}
            <span className={styles.yellow}>1:{performance.averageRR}R</span>
          </h3>
        </div>

        {/* Right side */}
        <div className={styles.tradingdatar}>
          <h2>Performance Metrics</h2>

          <h3>
            <FiTrendingUp className={`${styles.icon} ${styles.iconGreen}`} />
            Total Return:{" "}
            <span
              className={
                performance.totalPnL > 0
                  ? styles.profit
                  : performance.totalPnL < 0
                  ? styles.loss
                  : styles.neutral
              }
            >
              ${performance.totalPnL}
            </span>
          </h3>

          <h3>
            <FaTrophy className={`${styles.icon} ${styles.iconBlue}`} />
            Live Trades:{" "}
            <span className={styles.blue}>{performance.totalLiveTrades}</span>
          </h3>

          <h3>
            <FaPercentage className={`${styles.icon} ${styles.iconYellow}`} />
            Total Risk:{" "}
            <span className={styles.yellow}>${performance.totalRisk}</span>
          </h3>

          <div className={styles.linecontainer}>
            <div className={styles.line}></div>
          </div>

          <h2>Quick Stats</h2>
          <h3>
            Initial Capital: <span>${accountDetails?.initialCapital}</span>
          </h3>
          <h3>
            Current Balance: <span>${accountDetails?.currentBalance}</span>
          </h3>
        </div>
      </div>
    </div>
  );
};
