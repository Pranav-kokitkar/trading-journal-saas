// src/components/Pages/Dashboard/RiskChart.jsx
import React, { useContext } from "react";
import styles from "./dashboard.module.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PerformanceContext } from "../../../context/PerformanceContext";

const chartVar = (name, fallback) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

const RiskChart = ({ trades }) => {
  const { performance } = useContext(PerformanceContext);
  const accentColor = chartVar("--accent-primary", "var(--accent-primary)");
  const neutralColor = chartVar("--color-neutral", "var(--color-neutral)");

  const data = trades.map((trade, index) => ({
    tradeNumber: index + 1,
    riskAmount: parseFloat(trade.riskamount) || 0,
    riskPercent: parseFloat(trade.riskPercent) || 0,
  }));

  if (data.length === 0) {
    return <p>No trades available for Risk chart.</p>;
  }

  // Hide dots if too many trades
  const showDots = data.length <= 50;

  return (
    <div className={styles.chartcontainer}>
      <div className={styles.chart} style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chartVar("--chart-grid", "var(--chart-grid)")} />
            <XAxis
              dataKey="tradeNumber"
              label={{ value: "Trade #", position: "insideBottom", offset: -5 }}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: "Risk", angle: -90, position: "outsideLeft" }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: chartVar("--chart-tooltip-bg", "var(--chart-tooltip-bg)"),
                border: `1px solid ${chartVar("--chart-tooltip-border", "var(--chart-tooltip-border)")}`,
                borderRadius: "12px",
              }}
              formatter={(value, name) =>
                name === "riskPercent"
                  ? [`${value}%`, "Risk (%)"]
                  : [`$${value}`, "Risk ($)"]
              }
              labelFormatter={(label) => `Trade #${label}`}
            />
            {/* Dollar Risk Line */}
            <Line
              type="monotone"
              dataKey="riskAmount"
              stroke={neutralColor}
              strokeWidth={2}
              dot={showDots}
              activeDot={{ r: 6 }}
            />
            {/* % Risk Line */}
            <Line
              type="monotone"
              dataKey="riskPercent"
              stroke={accentColor}
              strokeWidth={2}
              dot={showDots}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.quickdata}>
        <p>Highest Risk: ${performance.highestRisk}</p>
        <p>Lowest Risk: ${performance.lowestRisk}</p>
      </div>
    </div>
  );
};

export default RiskChart;
