// src/components/Pages/Dashboard/WinLossChart.jsx
import React, { useContext } from "react";
import styles from "./dashboard.module.css";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PerformanceContext } from "../../../context/PerformanceContext";

const COLORS = ["#4caf50", "#f44336", "#ff9800"]; // Wins, Losses, Breakeven

const WinLossChart = ({ trades }) => {
  const { performance } = useContext(PerformanceContext);

  if (trades.length === 0) {
    return <p>No trades available for win/loss chart.</p>;
  }

  // Aggregate data
  const wins = trades.filter((t) => t.tradeResult === "win").length;
  const losses = trades.filter((t) => t.tradeResult === "loss").length;
  const breakeven = trades.filter((t) => t.tradeResult === "breakeven").length;

  const data = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
    { name: "Breakeven", value: breakeven },
  ];

  return (
    <div className={styles.chartcontainer}>
      <div className={styles.chart} style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value}`, name]}
              // labelFormatter is optional for PieChart
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.quickdata}>
        <p>Win Rate: {performance.winRate}%</p>
      </div>
    </div>
  );
};

export default WinLossChart;
