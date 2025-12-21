import styles from "./AccountPerformance.module.css";
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
  Cell,
} from "recharts";

export const AccountPerformance = ({ data }) => {
  // STEP B: Date formatter (only required addition)
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  if (!data) {
    return <p className={styles.loading}>Loading performance...</p>;
  }
  const hasPnLData =
    data.charts?.pnlPerDay && data.charts.pnlPerDay.length > 0;

  const hasdata =
    data.charts?.tradesPerDay &&
    data.charts.tradesPerDay.length > 0;

  return (
    <div>
      {/* Header */}
      <header className={styles.header}>
        <h2>Account Performance</h2>
        <p>Performance metrics are scoped to this account only</p>
      </header>

      {/* Summary Cards */}
      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <p className={styles.label}>Total PnL</p>
          <h3 className={styles.value}>{data.summary.totalPnL}</h3>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Total Trades</p>
          <h3 className={styles.value}>{data.summary.totalTrades}</h3>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Win Rate</p>
          <h3 className={styles.value}>{data.summary.winRate}%</h3>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Live Trades</p>
          <h3 className={styles.value}>{data.summary.totalLiveTrades}</h3>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Long Trades</p>
          <h3 className={styles.value}>{data.summary.totalLongTrades}</h3>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Short Trades</p>
          <h3 className={styles.value}>{data.summary.totalShortTrades}</h3>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Average PnL</p>
          <h3 className={styles.value}>{data.summary.avgPnL}</h3>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Average RR</p>
          <h3 className={styles.value}>{data.summary.avgRR}</h3>
        </div>

        <div className={styles.card}>
          <p className={styles.label}>Losing Trades</p>
          <h3 className={styles.value}>{data.summary.losingTrades}</h3>
        </div>
        <div className={styles.card}>
          <p className={styles.label}>Profit Factor</p>
          <h3 className={styles.value}>{data.performance.profitFactor}</h3>
        </div>
        <div className={styles.card}>
          <p className={styles.label}>Total loss</p>
          <h3 className={styles.value}>{data.performance.totalLoss}</h3>
        </div>
      </div>

      {/* PnL Over Time Chart */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>PnL Over Time</h3>

        {hasPnLData ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.charts.pnlPerDay}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />

              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#9aa4b2"
                tick={{ fontSize: 12 }}
              />

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

              <Line
                type="monotone"
                dataKey="pnl"
                stroke="#f5c56b"
                strokeWidth={2}
                dot={({ cx, cy, payload }) => (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={payload.pnl >= 0 ? "#16a34a" : "#dc2626"}
                  />
                )}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.emptyState}>No PnL data available</p>
        )}
      </div>

      {/* Trades Per Day Chart */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Trades Per Day</h3>

        {hasdata ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.charts.tradesPerDay}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />

              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#9aa4b2"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                stroke="#9aa4b2"
                tick={{ fontSize: 12 }}
                allowDecimals={false}
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
                {data.charts.tradesPerDay.map((_, index) => {
                  const pnl = data.charts.pnlPerDay[index]?.pnl || 0;
                  return (
                    <Cell key={index} fill={pnl >= 0 ? "#16a34a" : "#dc2626"} />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.emptyState}>No trade data available</p>
        )}
      </div>
    </div>
  );
};
