import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./Compare.module.css";

export const ComparisonCharts = ({ equityCurveData, expectancyData }) => {
  return (
    <div className={styles.chartsSection}>
      {/* Equity Curve Comparison */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Equity Curve Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={equityCurveData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="tradeNumber"
              label={{
                value: "Trade Number",
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              label={{
                value: "Cumulative P&L ($)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="datasetA"
              stroke="#10b981"
              strokeWidth={2}
              name="Dataset A"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="datasetB"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Dataset B"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Expectancy Progression Comparison */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Expectancy Progression</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={expectancyData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="tradeNumber"
              label={{
                value: "Trade Number",
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              label={{
                value: "Expectancy ($)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="datasetA"
              stroke="#10b981"
              strokeWidth={2}
              name="Dataset A"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="datasetB"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Dataset B"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
