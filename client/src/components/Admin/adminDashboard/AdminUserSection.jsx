import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import styles from "./AdminDashboard.module.css";

export const AdminUserSection  = ({ data }) => {
  if (!data) return null;

  const { cards, charts } = data;

  return (
    <section className={styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Users</h2>
        <p>User growth and adoption overview</p>
      </div>

      {/* Cards */}
      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <h4>Total Users</h4>
          <span>{cards.totalUsers}</span>
        </div>

        <div className={styles.card}>
          <h4>Regular Users</h4>
          <span>{cards.regularUsers}</span>
        </div>

        <div className={styles.card}>
          <h4>Admin Users</h4>
          <span>{cards.adminUsers}</span>
        </div>

        <div className={styles.card}>
          <h4>Avg Accounts / User</h4>
          <span>{cards.avgAccountsPerUser.toFixed(2)}</span>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        {/* Users Over Time */}
        <div className={styles.chartCard}>
          <h4>Users Over Time</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={charts.usersOverTime || []}>
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

        {/* Admin vs User Distribution */}
        <div className={styles.chartCard}>
          <h4>User Role Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.userRoleDistribution || []}
                dataKey="count"
                nameKey="role"
                outerRadius={90}
                innerRadius={50}
                label
              >
                {(charts.userRoleDistribution || []).map((_, index) => (
                  <Cell
                    key={index}
                    fill={index === 0 ? "#f5c56b" : "#3b82f6"}
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
      </div>
    </section>
  );
};
