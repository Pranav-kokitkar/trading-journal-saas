// src/components/Pages/Dashboard/DirectionChart.jsx
import React from "react";
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

  // Separate Long and Short trades (lowercase)
  const longTrades = trades.filter((trade) => trade.tradedirection === "long");
  const shortTrades = trades.filter(
    (trade) => trade.tradedirection === "short"
  );

  // Count wins for each
  const longWins = longTrades.filter(
    (trade) => trade.tradeResult === "win"
  ).length;
  const shortWins = shortTrades.filter(
    (trade) => trade.tradeResult === "win"
  ).length;

  // Total trades for each
  const longTotal = longTrades.length;
  const shortTotal = shortTrades.length;

  // Success rates (%)
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
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="direction" stroke="#ccc" />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(val) => `${val}%`}
          stroke="#ccc"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#2a2a2a",
            border: "none",
            color: "#fff",
          }}
          formatter={(value) => `${value}%`}
        />
        <Bar dataKey="successRate" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList
            dataKey="total"
            position="top"
            formatter={(val) => `Total: ${val}`}
            style={{ fill: "#fff", fontWeight: "bold" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DirectionChart;
