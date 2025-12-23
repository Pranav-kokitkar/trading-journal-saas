import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import styles from "./AdminDashboard.module.css";

export const AdminTradesSection = ({ data }) => {
  if (!data) return null;

  const { cards, charts } = data;

  return (
    <section className={styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Trades</h2>
        <p>Trading activity and journaling health</p>
      </div>

      {/* Cards */}
      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <h4>Total Trades</h4>
          <span>{cards.totalTrades}</span>
        </div>

        <div className={styles.card}>
          <h4>Wins</h4>
          <span>{cards.wins}</span>
        </div>

        <div className={styles.card}>
          <h4>Losses</h4>
          <span>{cards.losses}</span>
        </div>

        <div className={styles.card}>
          <h4>Breakeven</h4>
          <span>{cards.breakeven}</span>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        {/* Trades Over Time */}
        <div className={styles.chartCard}>
          <h4>Trades Over Time</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts.tradesOverTime || []}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />

              <XAxis dataKey="date" stroke="#9aa4b2" tick={{ fontSize: 12 }} />

              <YAxis
                allowDecimals={false}
                stroke="#9aa4b2"
                tick={{ fontSize: 12 }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1a2f",
                  border: "1px solid rgba(245,197,107,0.3)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f5c56b" }}
                itemStyle={{ color: "#e5e7eb" }}
              />

              <Line
                type="monotone"
                dataKey="count"
                stroke="#f5c56b"
                strokeWidth={2}
                dot={{ r: 4, fill: "#f5c56b" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trade Direction Distribution */}
        <div className={styles.chartCard}>
          <h4>Trade Direction</h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={charts.directionDistribution || []}
                dataKey="count"
                nameKey="direction"
                outerRadius={90}
                innerRadius={50}
                label
              >
                {(charts.directionDistribution || []).map((_, index) => (
                  <Cell
                    key={index}
                    fill={index === 0 ? "#16a34a" : "#dc2626"}
                  />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1a2f",
                  border: "1px solid rgba(245,197,107,0.3)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f5c56b" }}
                itemStyle={{ color: "#e5e7eb" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Trade Result Distribution */}
        <div className={styles.chartCard}>
          <h4>Trade Results</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.resultDistribution || []}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />

              <XAxis
                dataKey="result"
                stroke="#9aa4b2"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                allowDecimals={false}
                stroke="#9aa4b2"
                tick={{ fontSize: 12 }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1a2f",
                  border: "1px solid rgba(245,197,107,0.3)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f5c56b" }}
                itemStyle={{ color: "#e5e7eb" }}
              />

              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {(charts.resultDistribution || []).map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.result === "win"
                        ? "#16a34a"
                        : entry.result === "loss"
                        ? "#dc2626"
                        : "#9aa4b2"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk % Distribution */}
        <div className={styles.chartCard}>
          <h4>Risk Percentage Distribution</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.riskDistribution || []}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />

              <XAxis dataKey="_id" stroke="#9aa4b2" tick={{ fontSize: 12 }} />

              <YAxis
                allowDecimals={false}
                stroke="#9aa4b2"
                tick={{ fontSize: 12 }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1a2f",
                  border: "1px solid rgba(245,197,107,0.3)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f5c56b" }}
                itemStyle={{ color: "#e5e7eb" }}
              />

              <Bar dataKey="count" fill="#f5c56b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};
