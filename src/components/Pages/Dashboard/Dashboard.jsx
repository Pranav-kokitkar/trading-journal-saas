// src/components/Pages/Dashboard/Dashboard.jsx
import React, { useContext } from "react";
import styles from "./dashboard.module.css"
import EquityCurveChart from "./EquityCurveChart";
import WinLossChart from "./WinLossChart";
import PnLChart from "./PnLChart";
import RiskChart from "./RiskChart";
import DirectionChart from "./DirectionChart";
import { AccountContext } from "../../../context/AccountContext";
import { PerformanceContext } from "../../../context/PerformanceContext";

export const Dashboard = () => {

  const {accountDetails, setAccountDetails} = useContext(AccountContext);

  const {performance, setPerformance} = useContext(PerformanceContext);

  const trades = JSON.parse(localStorage.getItem("trades")) || [];

  return (
    <section className={styles.dashboard}>
      <div>
        <h2>Trading Dashboard</h2>
        <div className={styles.tradingdata}>
          <div className={styles.tradingdatal}>
            <h3>
              Total Trade:<span>{performance.totalTrades}</span>
            </h3>
            <h3>Win Rate:<span>{performance.winRate}%</span></h3>
            <h3>
              Total PnL: <span>{performance.totalPnL}</span>
            </h3>
            <h3>
              Average RR: <span>{performance.averageRR}R</span>
            </h3>
          </div>

          <div className={styles.tradingdatar}>
            <h2>Performance Metrics</h2>
            <h3>Total return</h3>
            <h3>Live Trades:<span>{performance.totalLiveTrades}</span></h3>
            <h3>Total Risk</h3>
            <div className={styles.linecontainer}>
              <div className={styles.line}></div>
            </div>
            <h2>Quick Stats</h2>
            <h3>Inital Capital</h3>
            <h3>Current Balance</h3>
          </div>
        </div>
      </div>
      <div>
        <h2>Trading Performance</h2>
        <EquityCurveChart trades={trades} />
        <WinLossChart trades={trades} />
        <PnLChart trades={trades} />
        <RiskChart trades={trades} />
        <DirectionChart trades={trades} />
      </div>
    </section>
  );
};
