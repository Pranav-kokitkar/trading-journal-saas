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
import { useTrades } from "../../../store/TradeContext";
import styles from "./AnalyticsDashboard.module.css";
import { SkeletonChart, SkeletonTableRow, SkeletonText } from "../../ui/skeleton/Skeleton";

const TABS = [
  { key: "strategy", label: "Strategy" },
  { key: "session", label: "Session" },
  { key: "symbol", label: "Symbol" },
  { key: "direction", label: "Direction" },
  { key: "duration", label: "Duration" },
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

const MIN_CONFIDENCE_TRADES = 10;
const MAX_PRIMARY_INSIGHTS = 4;
const OVERTRADING_DAILY_LIMIT = 5;
const LOSS_STREAK_TRIGGER = 3;
const REVENGE_WINDOW_MINUTES = 30;
const REVENGE_RISK_MULTIPLIER = 1.2;

const DIMENSION_LABEL_PREFIX = {
  strategy: "Strategy",
  session: "Session",
  symbol: "Symbol",
  direction: "Direction",
  duration: "Duration",
  tag: "Tag",
  marketType: "Market Type",
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

const formatSignedPercent = (value) => {
  const normalized = Number(value);
  if (Number.isNaN(normalized)) return "0.00%";
  return `${normalized >= 0 ? "+" : ""}${normalized.toFixed(2)}%`;
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const getTradeDate = (trade) =>
  parseDate(trade?.entryTime || trade?.dateTime || trade?.dateNtime);

const normalizeTradeResult = (trade) => String(trade?.tradeResult || "").toLowerCase();

const isWinTrade = (trade) => {
  const result = normalizeTradeResult(trade);
  const pnl = Number(trade?.pnl || 0);
  return result === "win" || (result === "" && pnl > 0);
};

const isLossTrade = (trade) => {
  const result = normalizeTradeResult(trade);
  const pnl = Number(trade?.pnl || 0);
  return result === "loss" || (result === "" && pnl < 0);
};

const calculateWinRate = (trades) => {
  if (!Array.isArray(trades) || trades.length === 0) return null;
  const wins = trades.reduce((sum, trade) => sum + (isWinTrade(trade) ? 1 : 0), 0);
  return (wins / trades.length) * 100;
};

const isExitedTrade = (trade) => {
  const status = String(trade?.tradeStatus || "").toLowerCase();
  return status === "exited" || status === "closed";
};

const isTradeWithinDate = (trade, startDate, endDate) => {
  const tradeDate = getTradeDate(trade);
  if (!tradeDate) return true;

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (start && tradeDate < start) return false;

  if (end) {
    const inclusiveEnd = new Date(end);
    inclusiveEnd.setHours(23, 59, 59, 999);
    if (tradeDate > inclusiveEnd) return false;
  }

  return true;
};

const getTradeRiskValue = (trade) => {
  const riskAmount = Number(trade?.riskAmount ?? trade?.riskamount ?? 0);
  if (!Number.isNaN(riskAmount) && riskAmount > 0) return riskAmount;

  const riskPercent = Number(trade?.riskPercent ?? 0);
  if (!Number.isNaN(riskPercent) && riskPercent > 0) return riskPercent;

  return 0;
};

const getBehaviorInsights = (trades) => {
  if (!Array.isArray(trades) || trades.length < MIN_CONFIDENCE_TRADES) return [];

  const ordered = [...trades]
    .filter((trade) => getTradeDate(trade))
    .sort((a, b) => getTradeDate(a).getTime() - getTradeDate(b).getTime());

  if (!ordered.length) return [];

  const insights = [];

  const dayBuckets = ordered.reduce((acc, trade) => {
    const dayKey = getTradeDate(trade).toISOString().slice(0, 10);
    const current = acc.get(dayKey) || [];
    current.push(trade);
    acc.set(dayKey, current);
    return acc;
  }, new Map());

  const dailyGroups = Array.from(dayBuckets.values());
  const highFrequencyDays = dailyGroups.filter((bucket) => bucket.length > OVERTRADING_DAILY_LIMIT);
  if (highFrequencyDays.length > 0) {
    const highTrades = highFrequencyDays.flat();
    const normalTrades = dailyGroups
      .filter((bucket) => bucket.length <= OVERTRADING_DAILY_LIMIT)
      .flat();
    const highWinRate = calculateWinRate(highTrades);
    const normalWinRate = calculateWinRate(normalTrades);
    const winRateGap =
      highWinRate !== null && normalWinRate !== null ? normalWinRate - highWinRate : null;
    const maxTradesInDay = Math.max(...highFrequencyDays.map((bucket) => bucket.length));

    insights.push({
      type: "warning",
      title: "Overtrading",
      description:
        winRateGap !== null
          ? `You had ${highFrequencyDays.length} high-frequency day(s) with up to ${maxTradesInDay} trades. Win rate on those sessions is ${formatSignedPercent(-winRateGap)} versus regular days.`
          : `You had ${highFrequencyDays.length} high-frequency day(s) with up to ${maxTradesInDay} trades, which correlates with noisier execution quality.`,
      suggestion: "Set a daily trade cap and stop after your planned A+ setups are exhausted.",
    });
  }

  let currentLossStreak = 0;
  let longestLossStreak = 0;
  const postStreakTrades = [];

  ordered.forEach((trade) => {
    if (isLossTrade(trade)) {
      currentLossStreak += 1;
      longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
      return;
    }

    if (currentLossStreak >= LOSS_STREAK_TRIGGER) {
      postStreakTrades.push(trade);
    }
    currentLossStreak = 0;
  });

  if (longestLossStreak >= LOSS_STREAK_TRIGGER) {
    const postStreakWinRate = calculateWinRate(postStreakTrades);
    const postStreakAvgPnl =
      postStreakTrades.length > 0
        ? postStreakTrades.reduce((sum, trade) => sum + Number(trade?.pnl || 0), 0) /
          postStreakTrades.length
        : null;

    insights.push({
      type: "warning",
      title: "Loss Streak (Tilt)",
      description:
        postStreakWinRate !== null
          ? `Your longest losing run is ${longestLossStreak} trades. The next-trade win rate after streaks is ${formatMetric(postStreakWinRate, "%")} with average PnL ${formatMetric(postStreakAvgPnl)}.`
          : `Your longest losing run is ${longestLossStreak} trades, which is a consistent tilt trigger in this sample.`,
      suggestion: `Apply a hard pause rule after ${LOSS_STREAK_TRIGGER} consecutive losses before re-entry.`,
    });
  }

  const revengeTrades = [];
  const nonRevengeTrades = [];

  for (let index = 1; index < ordered.length; index += 1) {
    const previousTrade = ordered[index - 1];
    const currentTrade = ordered[index];
    const previousDate = getTradeDate(previousTrade);
    const currentDate = getTradeDate(currentTrade);

    if (!previousDate || !currentDate) {
      nonRevengeTrades.push(currentTrade);
      continue;
    }

    const minutesSinceLoss = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60);
    const previousRisk = getTradeRiskValue(previousTrade);
    const currentRisk = getTradeRiskValue(currentTrade);
    const hasRiskEscalation =
      previousRisk > 0 && currentRisk >= previousRisk * REVENGE_RISK_MULTIPLIER;
    const quickReEntryAfterLoss = isLossTrade(previousTrade) && minutesSinceLoss <= REVENGE_WINDOW_MINUTES;

    if (quickReEntryAfterLoss && hasRiskEscalation) {
      revengeTrades.push(currentTrade);
    } else {
      nonRevengeTrades.push(currentTrade);
    }
  }

  if (revengeTrades.length >= 2) {
    const revengeAvgPnl =
      revengeTrades.reduce((sum, trade) => sum + Number(trade?.pnl || 0), 0) / revengeTrades.length;
    const baselineAvgPnl =
      nonRevengeTrades.length > 0
        ? nonRevengeTrades.reduce((sum, trade) => sum + Number(trade?.pnl || 0), 0) /
          nonRevengeTrades.length
        : null;
    const delta = baselineAvgPnl === null ? null : revengeAvgPnl - baselineAvgPnl;

    insights.push({
      type: "danger",
      title: "Revenge Trading",
      description:
        delta !== null
          ? `${revengeTrades.length} trade(s) were opened within ${REVENGE_WINDOW_MINUTES} minutes of a loss with higher risk. Their average PnL is ${formatMetric(revengeAvgPnl)} (${formatSignedPercent(delta)} vs baseline).`
          : `${revengeTrades.length} trade(s) were opened quickly after a loss with risk escalation, a classic revenge pattern.`,
      suggestion: "After a losing trade, enforce a cooldown and keep risk static for the next setup.",
    });
  }

  return insights;
};

const getExpectationSortedRows = (rows) =>
  [...rows].sort((a, b) => Number(b.expectancy || 0) - Number(a.expectancy || 0));

const getWeightedAverage = (rows, key) => {
  const totalTrades = rows.reduce((sum, row) => sum + Number(row.totalTrades || 0), 0);
  if (!totalTrades) return null;

  const weightedSum = rows.reduce(
    (sum, row) => sum + Number(row[key] || 0) * Number(row.totalTrades || 0),
    0,
  );
  return weightedSum / totalTrades;
};

const formatGroupLabel = (dimension, groupName) => {
  const prefix = DIMENSION_LABEL_PREFIX[dimension] || "Group";
  const rawName = String(groupName || "Unknown").trim();
  const normalizedName = rawName.length === 1 ? rawName.toUpperCase() : rawName;
  return `${prefix}: ${normalizedName}`;
};

const getDimensionInsights = (rows, dimension, behaviorTrades = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { primaryInsights: [], secondaryInsights: [] };
  }

  const totalTrades = rows.reduce((sum, row) => sum + Number(row.totalTrades || 0), 0);
  if (totalTrades < MIN_CONFIDENCE_TRADES) {
    return { primaryInsights: [], secondaryInsights: [] };
  }

  const sortedByExpectancy = getExpectationSortedRows(rows);
  const hasComparativeRows = sortedByExpectancy.length > 1;
  const best = sortedByExpectancy[0] || null;
  const worst = hasComparativeRows
    ? sortedByExpectancy[sortedByExpectancy.length - 1]
    : null;
  const overallExpectancy = Number(getWeightedAverage(rows, "expectancy") || 0);
  const topByVolume = [...rows].sort(
    (a, b) => Number(b.totalTrades || 0) - Number(a.totalTrades || 0),
  )[0];

  const bestLabel = best ? formatGroupLabel(dimension, best.name) : "";
  const worstLabel = worst ? formatGroupLabel(dimension, worst.name) : "";

  const expectancySpread =
    best && worst
      ? Number(best.expectancy || 0) - Number(worst.expectancy || 0)
      : 0;
  const winRateSpread =
    best && worst ? Number(best.winRate || 0) - Number(worst.winRate || 0) : 0;

  const bestTradeShare = best
    ? (Number(best.totalTrades || 0) / Math.max(totalTrades, 1)) * 100
    : 0;
  const bestEdgeVsAverage = best ? Number(best.expectancy || 0) - overallExpectancy : 0;
  const bestEdgePct = (bestEdgeVsAverage / Math.max(Math.abs(overallExpectancy), 0.01)) * 100;

  const dragImpactR = worst
    ? (Number(worst.expectancy || 0) - overallExpectancy) * Number(worst.totalTrades || 0)
    : 0;

  const concentrationShare = topByVolume
    ? (Number(topByVolume.totalTrades || 0) / Math.max(totalTrades, 1)) * 100
    : 0;
  const concentrationLabel = topByVolume
    ? formatGroupLabel(dimension, topByVolume.name)
    : "";
  const concentrationType = concentrationShare >= 45 ? "warning" : "info";

  const primaryInsights = [
    best
      ? {
          type: "key",
          title: "Behavior: Your Strongest Pattern",
          description: `Best results are coming from ${bestLabel}: expectancy ${formatMetric(best.expectancy, "R")}, ${formatSignedPercent(bestEdgePct)} versus dimension average, across ${best.totalTrades || 0} trades (${formatMetric(bestTradeShare, "%")} share).`,
          suggestion: `Lean into ${bestLabel} conditions and use it as your baseline playbook.`,
        }
      : null,
    worst
      ? {
          type: "danger",
          title: "Behavior: Recurring Performance Drag",
          description: `${worstLabel} is the weak pocket: expectancy ${formatMetric(worst.expectancy, "R")} and an estimated ${formatMetric(dragImpactR, "R")} performance drag across ${worst.totalTrades || 0} trades.`,
          suggestion: `Reduce exposure to ${worstLabel} until entry quality and execution improve.`,
        }
      : null,
    best && worst
      ? {
          type: "success",
          title: "Behavior: Edge Depends On Dimension",
          description: `${DIMENSION_LABEL_PREFIX[dimension] || "Dimension"} selection changes outcomes materially: ${formatMetric(expectancySpread, "R")} expectancy spread and ${formatSignedPercent(winRateSpread)} win-rate spread between top and bottom groups.`,
          suggestion: `Prioritize setups that match high-performing ${DIMENSION_LABEL_PREFIX[dimension] || "dimension"} groups.`,
        }
      : null,
    topByVolume
      ? {
          type: concentrationType,
          title: "Behavior: Allocation Concentration",
          description: `Trade flow is concentrated in ${concentrationLabel}, representing ${formatMetric(concentrationShare, "%")} of activity and strongly influencing total outcome.`,
          suggestion:
            concentrationShare >= 45
              ? `Keep size concentrated only if ${concentrationLabel} remains positive; otherwise rebalance toward stronger groups.`
              : "Your allocation is reasonably diversified; keep tracking which groups keep their edge.",
        }
      : null,
  ]
    .filter(Boolean)
    .slice(0, MAX_PRIMARY_INSIGHTS);

  const secondaryInsights = getBehaviorInsights(behaviorTrades);

  return { primaryInsights, secondaryInsights };
};

const InsightItem = ({ type, title, description, suggestion }) => {
  const toneClass =
    type === "key"
      ? styles.insightKey
      : type === "success"
      ? styles.insightSuccess
      : type === "danger"
        ? styles.insightDanger
        : type === "info"
          ? styles.insightInfo
          : styles.insightWarning;

  return (
    <article className={`${styles.insightItem} ${toneClass}`}>
      <span className={styles.insightIcon} aria-hidden="true"></span>
      <div className={styles.insightBody}>
        <p className={styles.insightTitle}>{title}</p>
        <p className={styles.insightDescription}>{description}</p>
        <p className={styles.insightSuggestion}>→ {suggestion}</p>
      </div>
    </article>
  );
};

export const AnalyticsDashboard = () => {
  const { authorizationToken, isAuthLoading } = useAuth();
  const { accounts = [] } = useContext(AccountContext);
  const {
    accountTrades = [],
    trades = [],
    refreshAllAccountTrades,
    includeImportedTrades,
    setIncludeImportedTrades,
  } = useTrades() || {};

  const [activeDimension, setActiveDimension] = useState("strategy");
  const [filters, setFilters] = useState(defaultFilters);
  const [sortBy, setSortBy] = useState("expectancy");
  const [order, setOrder] = useState("desc");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

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
          includeImported: Boolean(includeImportedTrades) ? "true" : "false",
        });

        if (filters.accountId) params.set("accountId", filters.accountId);
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);

        const response = await fetch(
          `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/analytics?${params.toString()}`,
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
    includeImportedTrades,
  ]);

  useEffect(() => {
    setShowMore(false);
  }, [activeDimension, filters.accountId, filters.startDate, filters.endDate, filters.minTrades, sortBy, order]);

  useEffect(() => {
    if (!filters.accountId || typeof refreshAllAccountTrades !== "function") return;
    refreshAllAccountTrades(filters.accountId, {
      includeImported: Boolean(includeImportedTrades),
    });
  }, [filters.accountId, includeImportedTrades, refreshAllAccountTrades]);

  const behaviorTrades = useMemo(() => {
    const source =
      filters.accountId && accountTrades.length > 0
        ? accountTrades
        : accountTrades.length > 0
          ? accountTrades
          : trades;

    if (!Array.isArray(source) || source.length === 0) return [];

    return source.filter((trade) => {
      const tradeAccountId = String(trade?.accountId?._id || trade?.accountId || "");

      return (
        isExitedTrade(trade) &&
        (!filters.accountId || tradeAccountId === String(filters.accountId)) &&
        isTradeWithinDate(trade, filters.startDate, filters.endDate)
      );
    });
  }, [accountTrades, trades, filters.accountId, filters.startDate, filters.endDate]);

  const insights = useMemo(
    () => getDimensionInsights(rows, activeDimension, behaviorTrades),
    [rows, activeDimension, behaviorTrades],
  );

  const chartData = useMemo(
    () =>
      rows.map((item) => ({
        name: item.name,
        expectancy: Number(item.expectancy || 0),
      })),
    [rows],
  );

  const isMobileChart = typeof window !== "undefined" && window.innerWidth <= 768;
  const chartMargins = isMobileChart
    ? { top: 12, right: 12, left: 4, bottom: 12 }
    : { top: 12, right: 20, left: 16, bottom: 12 };
  const chartYAxisWidth = isMobileChart ? 108 : 140;

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

      <div className={styles.tabsRow}>
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

        <label className={styles.importToggleLabel}>
          <input
            type="checkbox"
            checked={Boolean(includeImportedTrades)}
            onChange={(e) =>
              typeof setIncludeImportedTrades === "function" &&
              setIncludeImportedTrades(e.target.checked)
            }
          />
          <span>Include Imported Trades</span>
        </label>
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

      <div className={styles.insightsCard}>
        <h3 className={styles.insightsHeading}>Psychological Insights</h3>
        {insights.primaryInsights.length === 0 ? (
          <p className={styles.state}>Not enough data to generate insights.</p>
        ) : (
          <>
            <div className={styles.insightList}>
              {insights.primaryInsights.map((insight, index) => (
                <InsightItem
                  key={`primary-${insight.title}-${index}`}
                  type={insight.type}
                  title={insight.title}
                  description={insight.description}
                  suggestion={insight.suggestion}
                />
              ))}

              {showMore &&
                insights.secondaryInsights.map((insight, index) => (
                  <InsightItem
                    key={`secondary-${insight.title}-${index}`}
                    type={insight.type}
                    title={insight.title}
                    description={insight.description}
                    suggestion={insight.suggestion}
                  />
                ))}
            </div>

            {insights.secondaryInsights.length > 0 && (
              <button
                type="button"
                className={styles.insightToggle}
                onClick={() => setShowMore((prev) => !prev)}
              >
                {showMore ? "Show Less ↑" : "View More Insights ↓"}
              </button>
            )}
          </>
        )}
      </div>

      <div className={styles.tableCard}>
        {loading || isAuthLoading ? (
          <AnalyticsTableLoading />
        ) : rows.length === 0 ? (
          <p className={styles.state}>No analytics matched these filters. Try widening the date range or lowering minimum trades.</p>
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

      {(loading || isAuthLoading || rows.length > 0) && (
        <div className={styles.chartCard}>
          <h3>Expectancy by Group</h3>
          {loading || isAuthLoading ? (
            <SkeletonChart className={styles.analyticsChartSkeleton} height={360} />
          ) : (
            <>
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
                  margin={chartMargins}
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
                    width={chartYAxisWidth}
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
            </>
          )}
        </div>
      )}
    </section>
  );
};

const AnalyticsTableLoading = () => (
  <div className={styles.analyticsTableSkeleton}>
    <SkeletonText lines={1} width="180px" height={14} />
    {Array.from({ length: 7 }).map((_, index) => (
      <SkeletonTableRow key={`analytics-row-skeleton-${index}`} columns={7} />
    ))}
  </div>
);
