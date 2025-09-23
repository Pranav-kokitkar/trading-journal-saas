// src/components/Pages/Dashboard/WinLossChart.jsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#4caf50", "#f44336", "#ff9800"]; // green, red, orange

const WinLossChart = ({ trades }) => {
  // Aggregate data
  const wins = trades.filter((t) => t.tradeResult === "win").length;
  const losses = trades.filter((t) => t.tradeResult === "loss").length;
  const breakeven = trades.filter((t) => t.tradeResult === "breakeven").length;

  const data = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
    { name: "Breakeven", value: breakeven },
  ];

  if (trades.length === 0) {
    return <p>No trades available for win/loss chart.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data} // ✅ correct data, not trades
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default WinLossChart;
