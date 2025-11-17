// src/components/Pages/Dashboard/Dashboard.jsx
import React, { useContext } from "react";
import styles from "./dashboard.module.css";
import EquityCurveChart from "./EquityCurveChart";
import WinLossChart from "./WinLossChart";
import PnLChart from "./PnLChart";
import RiskChart from "./RiskChart";
import DirectionChart from "./DirectionChart";

import { AccountContext } from "../../../context/AccountContext";
import { PerformanceContext } from "../../../context/PerformanceContext";

import { FiActivity, FiTrendingUp, FiTarget } from "react-icons/fi";
import { FaTrophy, FaPercentage } from "react-icons/fa";
import { useAuth } from "../../../store/Auth";

export const Dashboard = () => {
  const { accountDetails } = useContext(AccountContext);
  const { performance } = useContext(PerformanceContext);

  const {user} = useAuth();

  const trades = JSON.parse(localStorage.getItem("trades")) || [];

  return (
    <section className={styles.dashboard}>
      <TradingDashboard
        accountDetails={accountDetails}
        performance={performance}
      />

      <h2 className={styles.tradingperformanceh2}>
        Hello {!user ? "user" : `${user.name}`} this is your Trading
        Performance
      </h2>
      <div className={styles.tradingperformance}>
        <div className={styles.chartCard}>
          <h3>Equity Curve</h3>
          <EquityCurveChart trades={trades} />
        </div>

        <div className={styles.chartCard}>
          <h3>Win / Loss</h3>
          <WinLossChart trades={trades} />
        </div>

        <div className={styles.chartCard}>
          <h3>PnL Per Trade</h3>
          <PnLChart trades={trades} />
        </div>

        <div className={styles.chartCard}>
          <h3>Risk Overview</h3>
          <RiskChart trades={trades} />
        </div>

        <div className={styles.chartCard}>
          <h3>Direction Success</h3>
          <DirectionChart trades={trades} />
        </div>
      </div>
    </section>
  );
};

const TradingDashboard = ({ accountDetails, performance }) => {
  return (
    <div>
      <h2>Trading Dashboard</h2>
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
            Average RR: {" "}
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
            Initial Capital: <span>${accountDetails.initialCapital}</span>
          </h3>
          <h3>
            Current Balance: <span>${accountDetails.balance}</span>
          </h3>
        </div>
      </div>
    </div>
  );
};
