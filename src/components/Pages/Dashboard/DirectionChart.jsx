// src/components/Pages/Dashboard/DirectionChart.jsx
import React from "react";
import styles from "./dashboard.module.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

const DirectionChart = ({ trades }) => {
  if (!trades || trades.length === 0) {
    return <p>No trades available for Direction chart.</p>;
  }

  // Separate Long and Short trades
  const longTrades = trades.filter((trade) => trade.tradedirection === "long");
  const shortTrades = trades.filter(
    (trade) => trade.tradedirection === "short"
  );

  // Count wins
  const longWins = longTrades.filter(
    (trade) => trade.tradeResult === "win"
  ).length;
  const shortWins = shortTrades.filter(
    (trade) => trade.tradeResult === "win"
  ).length;

  // Total trades
  const longTotal = longTrades.length;
  const shortTotal = shortTrades.length;

  // Success rates
  const longSuccessRate = longTotal
    ? ((longWins / longTotal) * 100).toFixed(1)
    : 0;
  const shortSuccessRate = shortTotal
    ? ((shortWins / shortTotal) * 100).toFixed(1)
    : 0;

  const data = [
    {
      direction: "Long",
      successRate: parseFloat(longSuccessRate),
      total: longTotal,
      fill: "#4caf50",
    },
    {
      direction: "Short",
      successRate: parseFloat(shortSuccessRate),
      total: shortTotal,
      fill: "#f44336",
    },
  ];

  return (
    <div className={styles.chartcontainer}>
      <div className={styles.chart} style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis dataKey="direction" stroke="#ccc" tick={{ fontSize: 12 }} />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
              stroke="#ccc"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#4a4a4aff",
                border: "none",
                color: "#fff",
              }}
              formatter={(value, name, props) => {
                const index = props.payload.index;
                return [`${value}%`, `Success Rate`];
              }}
              labelFormatter={(label, payload) => {
                const total = payload?.payload?.total || 0;
                return `Direction: ${label} (Total: ${total})`;
              }}
            />
            <Bar dataKey="successRate" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="total"
                position="top"
                formatter={(val) => (val > 0 ? `Total: ${val}` : "")}
                style={{ fill: "#ffffffff", fontWeight: "bold" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.quickdata}>
        <p>L - Win Rate: {longSuccessRate}%</p>
        <p>S - Win Rate: {shortSuccessRate}%</p>
      </div>
    </div>
  );
};

export default DirectionChart;
