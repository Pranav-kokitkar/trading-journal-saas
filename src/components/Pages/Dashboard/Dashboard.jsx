// src/components/Pages/Dashboard/Dashboard.jsx
import React from "react";
import EquityCurveChart from "./EquityCurveChart";
// import WinLossChart from "./WinLossChart";
// import PnLChart from "./PnLChart";
// import RiskChart from "./RiskChart";
// import DirectionChart from "./DirectionChart";

export const Dashboard = () => {
  // Fetch trades from localStorage
  const trades = JSON.parse(localStorage.getItem("trades")) || [];

  return (
    <div>
      <h2>Dashboard</h2>
      <EquityCurveChart trades={trades} />
      {/* <WinLossChart trades={trades} />
      <PnLChart trades={trades} />
      <RiskChart trades={trades} />
      <DirectionChart trades={trades} /> */}
    </div>
  );
};
