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

/**
 * Helper: read a property from a trade object trying multiple key variants.
 * Usage: read(trade, "tradeDirection", "tradedirection")
 */
const read = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
    // try lowercase match
    const lower = k.toLowerCase();
    const found = Object.keys(obj).find((x) => x.toLowerCase() === lower);
    if (found) return obj[found];
  }
  return undefined;
};

const DirectionChart = ({ trades }) => {
  if (!Array.isArray(trades) || trades.length === 0) {
    return <p>No trades available for Direction chart.</p>;
  }

  // Normalize and filter only finished trades (if your Dashboard passes closedTrades, this is fine)
  // but still tolerate trades that might be passed unfiltered.
  const finishedStatuses = new Set(["closed", "exited"]);
  const finished = trades.filter((t) =>
    finishedStatuses.has(String(read(t, "tradeStatus") || "").toLowerCase())
  );

  // If finished array is empty, fallback to input trades (so chart shows something if caller already filtered)
  const source = finished.length > 0 ? finished : trades;

  // Separate Long and Short trades (case-insensitive, flexible keys)
  const longTrades = source.filter(
    (trade) =>
      String(
        read(trade, "tradeDirection", "tradedirection") || ""
      ).toLowerCase() === "long"
  );
  const shortTrades = source.filter(
    (trade) =>
      String(
        read(trade, "tradeDirection", "tradedirection") || ""
      ).toLowerCase() === "short"
  );

  // Count wins (case-insensitive)
  const longWins = longTrades.filter(
    (trade) =>
      String(read(trade, "tradeResult", "tradeResult") || "").toLowerCase() ===
      "win"
  ).length;
  const shortWins = shortTrades.filter(
    (trade) =>
      String(read(trade, "tradeResult", "tradeResult") || "").toLowerCase() ===
      "win"
  ).length;

  // Totals
  const longTotal = longTrades.length;
  const shortTotal = shortTrades.length;

  // Success rates (numbers)
  const longSuccessRate = longTotal ? (longWins / longTotal) * 100 : 0;
  const shortSuccessRate = shortTotal ? (shortWins / shortTotal) * 100 : 0;

  const data = [
    {
      direction: "Long",
      successRate: Number(longSuccessRate.toFixed(1)),
      total: longTotal,
      fill: "#4caf50",
    },
    {
      direction: "Short",
      successRate: Number(shortSuccessRate.toFixed(1)),
      total: shortTotal,
      fill: "#f44336",
    },
  ];

  return (
    <div className={styles.chartcontainer}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="direction"
              stroke="#9aa4b2"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
              stroke="#9aa4b2"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
              }}
              formatter={(value, name, props) => {
                // value is numeric percent, show with % in tooltip
                return [`${value}%`, "Success Rate"];
              }}
              labelFormatter={(label, payload) => {
                const total = payload?.payload?.total ?? 0;
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
                style={{ fill: "#ffffff", fontWeight: "bold" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

      <div className={styles.quickdata}>
        <p>
          L - Win Rate: {longTotal ? Number(longSuccessRate.toFixed(1)) : 0}%
        </p>
        <p>
          S - Win Rate: {shortTotal ? Number(shortSuccessRate.toFixed(1)) : 0}%
        </p>
      </div>
    </div>
  );
};

export default DirectionChart;
