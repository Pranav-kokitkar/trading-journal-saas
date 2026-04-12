// src/components/Pages/Dashboard/EquityCurveChart.jsx
import React, { useContext } from "react";
import styles from "./dashboard.module.css";
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
import { PerformanceContext } from "../../../context/PerformanceContext";

const chartVar = (name, fallback) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

const EquityCurveChart = ({ trades }) => {
  const data = getEquityCurveData(trades);
  const { performance } = useContext(PerformanceContext);

  if (data.length === 0) {
    return <p>No trades available for equity curve chart.</p>;
  }

  const showDots = data.length <= 50;

  return (
    <div className={styles.chartcontainer}>
      {/* ✅ Give height directly to ResponsiveContainer */}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartVar("--chart-grid", "var(--chart-grid)")}
          />
          <XAxis
            dataKey="x"
            label={{ value: "Trade #", position: "insideBottom", offset: -5 }}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            label={{
              value: "Balance ($)",
              angle: -90,
              position: "insideLeft",
            }}
            tick={{ fontSize: 12 }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: chartVar("--chart-tooltip-bg", "var(--chart-tooltip-bg)"),
              border: `1px solid ${chartVar("--chart-tooltip-border", "var(--chart-tooltip-border)")}`,
              borderRadius: "12px",
            }}
            formatter={(value) => [`$${value}`, "Balance"]}
            labelFormatter={(label) => `Trade #${label}`}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke={chartVar("--accent-primary", "var(--accent-primary)")}
            strokeWidth={2}
            dot={showDots}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className={styles.quickdata}>
        <p>Highest Balance: ${performance.highestBalance}</p>
        <p>Lowest Balance: ${performance.lowestBalance}</p>
      </div>
    </div>
  );
};

export default EquityCurveChart;
