// src/components/Pages/Dashboard/EquityCurveChart.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { getEquityCurveData } from "../../../utils/chartData";

const EquityCurveChart = ({ trades }) => {
  const data = getEquityCurveData(trades);

  if (data.length === 0) {
    return <p>No trades available for equity curve chart.</p>;
  }

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            label={{ value: "Trade #", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            label={{ value: "Balance", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="y"
            stroke="#8884d8"
            strokeWidth={2}
            dot
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EquityCurveChart;
