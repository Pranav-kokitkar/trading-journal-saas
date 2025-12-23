import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import styles from "./AdminDashboard.module.css";

export const AdminContactsSection = ({ data }) => {
  if (!data) return null;

  const { cards, charts } = data;

  return (
    <section className={styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Contacts</h2>
        <p>Support requests and operational status</p>
      </div>

      {/* Cards */}
      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <h4>Total Contact Messages</h4>
          <span>{cards.totalContacts}</span>
        </div>

        <div className={styles.card}>
          <h4>Open</h4>
          <span>{cards.open}</span>
        </div>

        <div className={styles.card}>
          <h4>In Progress</h4>
          <span>{cards.inProgress}</span>
        </div>

        <div className={styles.card}>
          <h4>Resolved</h4>
          <span>{cards.resolved}</span>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h4>Contact Status Distribution</h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={charts.statusDistribution || []}
                dataKey="count"
                nameKey="status"
                outerRadius={100}
                innerRadius={55}
                label
              >
                {(charts.statusDistribution || []).map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.status === "open"
                        ? "#f5c56b"
                        : entry.status === "in_progress"
                        ? "#3b82f6"
                        : "#16a34a"
                    }
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
