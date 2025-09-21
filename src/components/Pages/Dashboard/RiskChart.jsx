// src/components/Pages/Dashboard/RiskChart.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RiskChart = ({ trades }) => {
  // Transform trades into risk data
  const data = trades.map((trade, index) => ({
    tradeNumber: index + 1,
    riskAmount: parseFloat(trade.riskamount) || 0,
    riskPercent: parseFloat(trade.riskPercent) || 0,
  }));

  if (data.length === 0) {
    return <p>No trades available for Risk chart.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="tradeNumber" />
        <YAxis />
        <Tooltip />
        {/* Line for Dollar Risk */}
        <Line
          type="monotone"
          dataKey="riskAmount"
          stroke="#ff9800"
          name="Risk ($)"
        />
        {/* Line for % Risk */}
        <Line
          type="monotone"
          dataKey="riskPercent"
          stroke="#2196f3"
          name="Risk (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RiskChart;
