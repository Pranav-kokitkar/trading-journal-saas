// src/components/Pages/Dashboard/Dashboard.jsx
import React from "react";
import styles from "./dashboard.module.css"
import EquityCurveChart from "./EquityCurveChart";
import WinLossChart from "./WinLossChart";
import PnLChart from "./PnLChart";
import RiskChart from "./RiskChart";
import DirectionChart from "./DirectionChart";

export const Dashboard = () => {
  
  const trades = JSON.parse(localStorage.getItem("trades")) || [];

  return (
    <section className={styles.dashboard}>
      <div>
        <h2>Trading Dashboard</h2>
        <div className={styles.tradingdata}>
          <div className={styles.tradingdatal}>
            <h3>Total Trade</h3>
            <h3>Win Rate</h3>
            <h3>Total PnL</h3>
            <h3>Average RR</h3>
          </div>

          <div className={styles.tradingdatar}>
            <h2>Performance Metrics</h2>
            <h3>Total return</h3>
            <h3>Live Trades</h3>
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
