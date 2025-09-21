// src/components/Pages/Dashboard/PnLChart.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PnLChart = ({ trades }) => {
  // Transform trades into PnL data
  const data = trades.map((trade, index) => ({
    tradeNumber: index + 1,
    pnl: parseFloat(trade.pnl) || 0,
  }));

  if (data.length === 0) {
    return <p>No trades available for PnL chart.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="tradeNumber" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="pnl" fill="#2196f3" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PnLChart;
