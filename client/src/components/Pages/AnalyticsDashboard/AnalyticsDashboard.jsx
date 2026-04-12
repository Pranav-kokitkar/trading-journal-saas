import { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useAuth } from "../../../store/Auth";
import { AccountContext } from "../../../context/AccountContext";
import styles from "./AnalyticsDashboard.module.css";

const TABS = [
  { key: "strategy", label: "Strategy" },
  { key: "session", label: "Session" },
  { key: "symbol", label: "Symbol" },
  { key: "direction", label: "Direction" },
  { key: "tag", label: "Tags" },
  { key: "marketType", label: "Market Type" },
];

const SORT_OPTIONS = [
  { value: "expectancy", label: "Expectancy" },
  { value: "winRate", label: "Win Rate" },
  { value: "totalPnL", label: "Total PnL" },
];

const defaultFilters = {
  accountId: "",
  startDate: "",
  endDate: "",
  minTrades: 0,
};

const cssVar = (name, fallback) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

const formatMetric = (value, suffix = "") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return `${Number(value).toFixed(2)}${suffix}`;
};

const getInsightLine = (label, item) => {
  if (!item) {
    return `${label}: Not enough data`;
  }
  return `${label}: ${item.name} (${formatMetric(item.expectancy, "R")} expectancy)`;
};

export const AnalyticsDashboard = () => {
  const { authorizationToken, isAuthLoading } = useAuth();
  const { accounts = [] } = useContext(AccountContext);

  const [activeDimension, setActiveDimension] = useState("strategy");
  const [filters, setFilters] = useState(defaultFilters);
  const [sortBy, setSortBy] = useState("expectancy");
  const [order, setOrder] = useState("desc");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!authorizationToken) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          dimension: activeDimension,
          sortBy,
          order,
          minTrades: String(Number(filters.minTrades) || 0),
        });

        if (filters.accountId) params.set("accountId", filters.accountId);
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/analytics?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: authorizationToken,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          toast.error(data?.message || "Failed to fetch analytics");
          setRows([]);
          return;
        }

        setRows(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error("Failed to fetch analytics");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [
    authorizationToken,
    activeDimension,
    filters.accountId,
    filters.startDate,
    filters.endDate,
    filters.minTrades,
    sortBy,
    order,
  ]);

  const insights = useMemo(() => {
    if (!rows.length) {
      return { best: null, worst: null };
    }

    const sorted = [...rows].sort(
      (a, b) => Number(b.expectancy || 0) - Number(a.expectancy || 0),
    );

    if (sorted.length === 1) {
      return {
        best: sorted[0],
        worst: null,
      };
    }

    const highestExpectancy = Number(sorted[0].expectancy || 0);
    const lowestExpectancy = Number(sorted[sorted.length - 1].expectancy || 0);

    if (highestExpectancy === lowestExpectancy) {
      return {
        best: sorted[0],
        worst: null,
      };
    }

    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
    };
  }, [rows]);

  const chartData = useMemo(
    () =>
      rows.map((item) => ({
        name: item.name,
        expectancy: Number(item.expectancy || 0),
      })),
    [rows],
  );

  const chartHeight = useMemo(() => {
    if (!rows.length) return 360;
    return Math.max(360, rows.length * 52);
  }, [rows.length]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: name === "minTrades" ? Math.max(0, Number(value) || 0) : value,
    }));
  };

  return (
    <section className={`${styles.page} app-page`}>
      <div className={`${styles.heading} app-page-heading`}>
        <h2 className="app-page-title">
          Analytics <span>Dashboard</span>
        </h2>
        <p className="app-page-subtitle">
          Multi-dimensional trade analytics across strategy, session, symbol, tags and more
        </p>
      </div>

      <div className={styles.insightsCard}>
        <p className={styles.best}>▲ {getInsightLine("Best Performing Group", insights.best)}</p>
        <p className={styles.worst}>▼ {getInsightLine("Weak Group", insights.worst)}</p>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeDimension === tab.key ? styles.activeTab : styles.tab}
            onClick={() => setActiveDimension(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.filtersCard}>
        <select
          name="accountId"
          value={filters.accountId}
          onChange={handleFilterChange}
          disabled={accounts.length === 0}
        >
          <option value="">
            {accounts.length === 0 ? "Create an account first" : "All Accounts"}
          </option>
          {accounts.map((acc) => (
            <option key={acc._id} value={acc._id}>
              {acc.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
        />

        <input
          type="number"
          min="0"
          name="minTrades"
          value={filters.minTrades}
          onChange={handleFilterChange}
          placeholder="Min trades"
        />

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>

        <button type="button" onClick={() => setOrder((prev) => (prev === "asc" ? "desc" : "asc"))}>
          {order === "asc" ? "Ascending" : "Descending"}
        </button>
      </div>

      <div className={styles.tableCard}>
        {loading || isAuthLoading ? (
          <p className={styles.state}>Loading analytics...</p>
        ) : rows.length === 0 ? (
          <p className={styles.state}>No analytics data available for selected filters.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Trades</th>
                  <th>Win Rate</th>
                  <th>Expectancy (R)</th>
                  <th>Profit Factor</th>
                  <th>Avg RR</th>
                  <th>Total PnL</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${activeDimension}-${row.name}-${row.key}`}>
                    <td>{row.name}</td>
                    <td>{row.totalTrades}</td>
                    <td className={Number(row.winRate) >= 50 ? styles.positive : styles.negative}>
                      {formatMetric(row.winRate, "%")}
                    </td>
                    <td className={Number(row.expectancy) >= 0 ? styles.positive : styles.negative}>
                      {formatMetric(row.expectancy)}
                    </td>
                    <td className={(row.profitFactor ?? 0) >= 1 ? styles.positive : styles.negative}>
                      {row.profitFactor == null ? "—" : formatMetric(row.profitFactor)}
                    </td>
                    <td>{formatMetric(row.avgRR)}</td>
                    <td className={Number(row.totalPnL) >= 0 ? styles.positive : styles.negative}>
                      {formatMetric(row.totalPnL)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className={styles.chartCard}>
          <h3>Expectancy by Group</h3>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch}></span>
              Expectancy (R)
            </span>
          </div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 12, right: 20, left: 16, bottom: 12 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={cssVar("--chart-grid", "var(--chart-grid)")}
              />
              <XAxis
                type="number"
                tick={{
                  fill: cssVar("--chart-axis-text", "var(--chart-axis-text)"),
                  fontSize: Number.parseInt(cssVar("--chart-axis-font", "11"), 10) || 11,
                }}
              />
              <YAxis
                type="category"
                dataKey="name"
                interval={0}
                width={140}
                tick={{
                  fill: cssVar("--chart-axis-text", "var(--chart-axis-text)"),
                  fontSize: Number.parseInt(cssVar("--chart-axis-font", "11"), 10) || 11,
                }}
              />
              <Tooltip
                contentStyle={{
                  background: cssVar("--chart-tooltip-bg", "var(--chart-tooltip-bg)"),
                  border: `1px solid ${cssVar("--chart-tooltip-border", "var(--chart-tooltip-border)")}`,
                  borderRadius: cssVar("--chart-tooltip-radius", "10px"),
                  boxShadow: cssVar("--chart-tooltip-shadow", "var(--chart-tooltip-shadow)"),
                }}
              />
              <Bar
                dataKey="expectancy"
                fill={cssVar("--chart-series-accent", "var(--chart-series-accent)")}
                radius={[0, 6, 6, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
