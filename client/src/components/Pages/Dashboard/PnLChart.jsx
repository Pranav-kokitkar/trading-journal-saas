// src/components/Pages/Dashboard/PnLChart.jsx
import React, { useContext } from "react";
import styles from "./dashboard.module.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PerformanceContext } from "../../../context/PerformanceContext";

const PnLChart = ({ trades }) => {
  const { performance } = useContext(PerformanceContext);

  const data = trades.map((trade, index) => ({
    tradeNumber: index + 1,
    pnl: parseFloat(trade.pnl) || 0,
  }));

  if (data.length === 0) {
    return <p>No trades available for PnL chart.</p>;
  }

  return (
    <div className={styles.chartcontainer}>
      <div className={styles.chart} style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis
              dataKey="tradeNumber"
              label={{ value: "Trade #", position: "insideBottom", offset: -5 }}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              label={{ value: "PnL ($)", angle: -90, position: "insideLeft" }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => [
                `${value >= 0 ? "+" : ""}$${value}`,
                "PnL",
              ]}
              labelFormatter={(label) => `Trade #${label}`}
            />
            <Bar dataKey="pnl">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pnl >= 0 ? "#4caf50" : "#f44336"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.quickdata}>
        <p>Best Trade: ${performance.highestWin}</p>
        <p>Worst Trade: ${performance.lowestLoss}</p>
      </div>
    </div>
  );
};

export default PnLChart;
