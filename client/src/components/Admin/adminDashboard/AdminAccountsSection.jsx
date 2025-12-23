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
} from "recharts";
import styles from "./AdminDashboard.module.css";

export const AdminAccountsSection = ({ data }) => {
  if (!data) return null;

  const { cards, charts } = data;

  return (
    <section className={styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Accounts</h2>
        <p>Account usage and capital overview</p>
      </div>

      {/* Cards */}
      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <h4>Total Accounts</h4>
          <span>{cards.totalAccounts}</span>
        </div>

        <div className={styles.card}>
          <h4>Active Accounts</h4>
          <span>{cards.activeAccounts}</span>
        </div>

        <div className={styles.card}>
          <h4>Total Capital</h4>
          <span>₹{cards.totalCapital?.toLocaleString()}</span>
        </div>

        <div className={styles.card}>
          <h4>Current Balance</h4>
          <span>₹{cards.totalBalance?.toLocaleString()}</span>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        {/* Accounts Over Time */}
        <div className={styles.chartCard}>
          <h4>Accounts Over Time</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts.accountsOverTime || []}>
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

        {/* Capital vs Balance */}
        <div className={styles.chartCard}>
          <h4>Capital vs Balance</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.capitalVsBalance || []}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />

              <XAxis dataKey="name" stroke="#9aa4b2" tick={{ fontSize: 12 }} />

              <YAxis stroke="#9aa4b2" tick={{ fontSize: 12 }} />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1a2f",
                  border: "1px solid rgba(245,197,107,0.3)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f5c56b" }}
                itemStyle={{ color: "#e5e7eb" }}
              />

              <Bar
                dataKey="initialCapital"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="currentBalance"
                fill="#f5c56b"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};
