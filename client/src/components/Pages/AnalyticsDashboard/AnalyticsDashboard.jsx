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
const OVERTRADING_THRESHOLD = 5;

const DIMENSION_LABEL_PREFIX = {
  strategy: "Strategy",
  session: "Session",
  symbol: "Symbol",
  direction: "Direction",
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

const getFilterWindowDays = (startDate, endDate) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start && !end) return null;

  const today = new Date();
  const normalizedStart = start || end;
  const normalizedEnd = end || today;
  if (!normalizedStart || !normalizedEnd) return null;

  const earlier = normalizedStart <= normalizedEnd ? normalizedStart : normalizedEnd;
  const later = normalizedStart <= normalizedEnd ? normalizedEnd : normalizedStart;
  const diffMs = later.getTime() - earlier.getTime();
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
};

const getTradeDate = (trade) => parseDate(trade?.dateTime || trade?.dateNtime);

const normalizeTradeResult = (trade) => String(trade?.tradeResult || "").toLowerCase();

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

const getTradeDimensionValue = (trade, dimension) => {
  if (dimension === "strategy") {
    const strategyValue = trade?.strategyName || trade?.strategy?.name || trade?.strategy;
    return typeof strategyValue === "object" ? strategyValue?.name : strategyValue;
  }

  if (dimension === "session") return trade?.session;
  if (dimension === "symbol") return trade?.symbol;
  if (dimension === "direction") return trade?.tradeDirection || trade?.tradedirection;
  if (dimension === "marketType") return trade?.marketType;

  if (dimension === "tag") {
    const tags = Array.isArray(trade?.tags) ? trade.tags : [];
    const firstTag = tags[0];
    if (!firstTag) return null;
    if (typeof firstTag === "string") return firstTag;
    return firstTag?.name || firstTag?.label || null;
  }

  return null;
};

const calculateTradesPerDay = (trades) => {
  if (!Array.isArray(trades) || trades.length === 0) {
    return { averageTradesPerDay: 0, maxTradesInDay: 0 };
  }

  const buckets = trades.reduce((acc, trade) => {
    const tradeDate = getTradeDate(trade);
    if (!tradeDate) return acc;
    const dayKey = tradeDate.toISOString().slice(0, 10);
    acc[dayKey] = (acc[dayKey] || 0) + 1;
    return acc;
  }, {});

  const dayCounts = Object.values(buckets);
  if (!dayCounts.length) {
    return { averageTradesPerDay: 0, maxTradesInDay: 0 };
  }

  const total = dayCounts.reduce((sum, count) => sum + Number(count || 0), 0);
  const averageTradesPerDay = total / dayCounts.length;
  const maxTradesInDay = Math.max(...dayCounts);

  return { averageTradesPerDay, maxTradesInDay };
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

const detectLossStreak = (trades) => {
  if (!Array.isArray(trades) || trades.length === 0) {
    return { hasLossStreak: false, streakSize: 0 };
  }

  const orderedTrades = [...trades].sort((a, b) => {
    const aDate = getTradeDate(a)?.getTime() || 0;
    const bDate = getTradeDate(b)?.getTime() || 0;
    return aDate - bDate;
  });

  let currentLossStreak = 0;
  let maxLossStreak = 0;

  orderedTrades.forEach((trade) => {
    const result = normalizeTradeResult(trade);
    const pnl = Number(trade?.pnl || 0);
    const isLoss = result === "loss" || (result === "" && pnl < 0);

    if (isLoss) {
      currentLossStreak += 1;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      return;
    }

    currentLossStreak = 0;
  });

  return {
    hasLossStreak: maxLossStreak >= 3,
    streakSize: maxLossStreak,
  };
};

const calculateAvgRR = (trades) => {
  if (!Array.isArray(trades) || trades.length === 0) return null;

  const rrValues = trades
    .map((trade) => Number(trade?.rr))
    .filter((rr) => !Number.isNaN(rr));

  if (!rrValues.length) return null;
  const total = rrValues.reduce((sum, rr) => sum + rr, 0);
  return total / rrValues.length;
};

const calculatePnLContribution = (trades, dimension) => {
  if (!Array.isArray(trades) || trades.length === 0) return null;

  const grouped = new Map();
  let totalPositivePnL = 0;

  trades.forEach((trade) => {
    const pnl = Number(trade?.pnl || 0);
    if (Number.isNaN(pnl) || pnl <= 0) return;

    const key = String(getTradeDimensionValue(trade, dimension) || "Unknown").trim();
    grouped.set(key, (grouped.get(key) || 0) + pnl);
    totalPositivePnL += pnl;
  });

  if (!totalPositivePnL || grouped.size === 0) return null;

  let topKey = null;
  let topPnL = 0;
  grouped.forEach((value, key) => {
    if (value > topPnL) {
      topKey = key;
      topPnL = value;
    }
  });

  if (!topKey) return null;

  return {
    groupName: topKey,
    contributionPct: (topPnL / totalPositivePnL) * 100,
    pnlValue: topPnL,
  };
};

const isWinningTrade = (trade) => {
  const result = normalizeTradeResult(trade);
  const pnl = Number(trade?.pnl || 0);
  return result === "win" || (result === "" && pnl > 0);
};

const calculateWinRate = (trades) => {
  if (!Array.isArray(trades) || trades.length === 0) return null;
  const wins = trades.reduce((sum, trade) => sum + (isWinningTrade(trade) ? 1 : 0), 0);
  return (wins / trades.length) * 100;
};

const getBehaviorInsightsByImpact = ({ trades, avgRR }) => {
  if (!Array.isArray(trades) || trades.length === 0) return [];

  const candidates = [];
  const { averageTradesPerDay, maxTradesInDay } = calculateTradesPerDay(trades);
  const { hasLossStreak, streakSize } = detectLossStreak(trades);
  const byDay = new Map();

  trades.forEach((trade) => {
    const tradeDate = getTradeDate(trade);
    if (!tradeDate) return;
    const dayKey = tradeDate.toISOString().slice(0, 10);
    const current = byDay.get(dayKey) || [];
    current.push(trade);
    byDay.set(dayKey, current);
  });

  const dayBuckets = Array.from(byDay.values());
  const highFrequencyDays = dayBuckets.filter((bucket) => bucket.length > OVERTRADING_THRESHOLD);
  const normalDays = dayBuckets.filter((bucket) => bucket.length <= OVERTRADING_THRESHOLD);
  const anyExtremelyHighDay = dayBuckets.some((bucket) => bucket.length > 7);

  if (averageTradesPerDay > OVERTRADING_THRESHOLD || maxTradesInDay > 7 || highFrequencyDays.length > 0 || anyExtremelyHighDay) {
    const highTrades = highFrequencyDays.flat();
    const normalTrades = normalDays.flat();
    const highWinRate = calculateWinRate(highTrades) ?? 0;
    const normalWinRate = calculateWinRate(normalTrades);
    const drop = normalWinRate === null ? 0 : Math.max(0, normalWinRate - highWinRate);
    const impactScore = drop + (anyExtremelyHighDay ? 5 : 0);

    candidates.push({
      key: "overtrading",
      impactScore,
      insight: {
        type: "warning",
        title: "Behavior: Overtrading Detected",
        description: "Your win rate drops when taking more than 5 trades per day.",
        suggestion: "Reduce number of trades and focus on quality setups.",
      },
    });
  }

  const orderedTrades = [...trades].sort((a, b) => {
    const aDate = getTradeDate(a)?.getTime() || 0;
    const bDate = getTradeDate(b)?.getTime() || 0;
    return aDate - bDate;
  });

  let lossStreak = 0;
  let maxLossStreak = 0;
  const afterStreakTrades = [];

  orderedTrades.forEach((trade) => {
    const isLoss = normalizeTradeResult(trade) === "loss" || Number(trade?.pnl || 0) < 0;

    if (isLoss) {
      lossStreak += 1;
      maxLossStreak = Math.max(maxLossStreak, lossStreak);
      return;
    }

    if (lossStreak >= 3) {
      afterStreakTrades.push(trade);
    }
    lossStreak = 0;
  });

  if (hasLossStreak || maxLossStreak >= 3) {
    const overallWinRate = calculateWinRate(trades) ?? 0;
    const afterStreakWinRate = calculateWinRate(afterStreakTrades);
    const drop =
      afterStreakWinRate === null ? 0 : Math.max(0, overallWinRate - afterStreakWinRate);

    candidates.push({
      key: "lossStreak",
      impactScore: drop + Math.max(maxLossStreak, Number(streakSize || 0)),
      insight: {
        type: "warning",
        title: "Behavior: Loss Streak Impact",
        description: "Performance drops after multiple consecutive losses.",
        suggestion: "Consider stopping trading after 2 consecutive losses.",
      },
    });
  }

  const lowRRTrades = trades.filter((trade) => {
    const rr = Number(trade?.rr);
    return !Number.isNaN(rr) && rr < 1;
  });
  const healthyRRTrades = trades.filter((trade) => {
    const rr = Number(trade?.rr);
    return !Number.isNaN(rr) && rr >= 1;
  });

  if (avgRR !== null && avgRR < 1 && lowRRTrades.length > 0) {
    const lowRRWinRate = calculateWinRate(lowRRTrades) ?? 0;
    const healthyRRWinRate = calculateWinRate(healthyRRTrades);
    const drop = healthyRRWinRate === null ? 0 : Math.max(0, healthyRRWinRate - lowRRWinRate);

    candidates.push({
      key: "lowRR",
      impactScore: drop + Math.abs(1 - avgRR) * 10,
      insight: {
        type: "warning",
        title: "Behavior: Low RR Trades",
        description: "Trades with low risk-reward ratio are underperforming.",
        suggestion: "Focus on setups with RR greater than 1.",
      },
    });
  }

  return candidates.sort((a, b) => b.impactScore - a.impactScore);
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
    includeImportedTrades,
  ]);

  useEffect(() => {
    if (!filters.accountId || typeof refreshAllAccountTrades !== "function") return;
    refreshAllAccountTrades(filters.accountId);
  }, [filters.accountId, refreshAllAccountTrades]);

  const behaviorTrades = useMemo(() => {
    const source = filters.accountId ? accountTrades : accountTrades.length > 0 ? accountTrades : trades;
    if (!Array.isArray(source) || source.length === 0) return [];

    return source.filter(
      (trade) =>
        isExitedTrade(trade) &&
        (!filters.accountId ||
          String(trade?.accountId?._id || trade?.accountId || "") === String(filters.accountId)) &&
        isTradeWithinDate(trade, filters.startDate, filters.endDate),
    );
  }, [accountTrades, trades, filters.accountId, filters.startDate, filters.endDate]);

  useEffect(() => {
    setShowMore(false);
  }, [activeDimension, filters.accountId, filters.startDate, filters.endDate, filters.minTrades, sortBy, order]);

  const insights = useMemo(() => {
    if (!rows.length) {
      return { primaryInsights: [], secondaryInsights: [] };
    }

    const sorted = getExpectationSortedRows(rows);
    const best = sorted[0] || null;
    const worst = sorted.length > 1 ? sorted[sorted.length - 1] : null;

    const avgRR = calculateAvgRR(behaviorTrades);
    const overallExpectancy = getWeightedAverage(rows, "expectancy");
    const lowConfidenceGroups = rows.filter(
      (row) => Number(row.totalTrades || 0) > 0 && Number(row.totalTrades || 0) < MIN_CONFIDENCE_TRADES,
    );
    const contribution = calculatePnLContribution(behaviorTrades, activeDimension);
    const behaviorRanked = getBehaviorInsightsByImpact({ trades: behaviorTrades, avgRR });
    const topBehaviorInsight = behaviorRanked[0]?.insight || null;
    const secondaryBehaviorInsights = behaviorRanked.slice(1).map((item) => item.insight);

    const bestLabel = best ? formatGroupLabel(activeDimension, best.name) : "";
    const worstLabel = worst ? formatGroupLabel(activeDimension, worst.name) : "";

    const peerRows = best
      ? rows.filter((row) => String(row.name) !== String(best.name))
      : [];
    const peerExpectancy =
      peerRows.length > 0 ? getWeightedAverage(peerRows, "expectancy") : overallExpectancy;

    const bestExpectancy = Number(best?.expectancy || 0);
    const benchmark = Number(peerExpectancy || 0);
    const edgeDenominator = Math.max(Math.abs(benchmark), 0.01);
    const edgePct = ((bestExpectancy - benchmark) / edgeDenominator) * 100;

    const comparisonPct = best && worst
      ? ((Number(best.expectancy || 0) - Number(worst.expectancy || 0)) /
          Math.max(Math.abs(Number(best.expectancy || 0)), Math.abs(Number(worst.expectancy || 0)), 0.01)) *
        100
      : 0;

    const keyInsight = best
      ? {
          type: "key",
          title: "🚨 Key Insight",
          description: `${bestLabel} generates significantly higher expectancy than others (${formatSignedPercent(edgePct)}). Based on ${best.totalTrades || 0} trades.`,
          suggestion: "This is your strongest edge - prioritize it.",
        }
      : null;

    const strongEdgeMerged = best
      ? {
          type: "success",
          title: "Strong Edge",
          description: `${bestLabel} is your strongest edge (${formatMetric(best.expectancy, "R")} expectancy), outperforming ${worstLabel || "weaker groups"} by ${formatSignedPercent(comparisonPct)}${contribution ? ` and contributing ${formatMetric(contribution.contributionPct, "%")} of total profit` : ""}. Based on ${best.totalTrades || 0} trades.`,
          suggestion: `Focus more on ${bestLabel} setups and reduce weaker exposure.`,
        }
      : null;

    const weakPerformance = worst
      ? {
          type: "danger",
          title: "Weak Performance",
          description: `${worstLabel} is your weakest performing group (${formatMetric(worst.expectancy, "R")} expectancy) based on ${worst.totalTrades || 0} trades.`,
          suggestion: `Review mistakes in ${worstLabel} and reduce exposure until consistency improves.`,
        }
      : null;

    const secondaryInsights = [];

    if (best && worst) {
      secondaryInsights.push({
        type: "info",
        title: "Performance Comparison",
        description: `${bestLabel} outperforms ${worstLabel} by ${formatSignedPercent(comparisonPct)} expectancy based on ${(best?.totalTrades || 0) + (worst?.totalTrades || 0)} trades in both groups.`,
        suggestion: `Shift allocation toward ${bestLabel} and tighten criteria in ${worstLabel}.`,
      });
    }

    secondaryInsights.push(...secondaryBehaviorInsights);

    if (lowConfidenceGroups.length > 0) {
      const sampleNames = lowConfidenceGroups
        .slice(0, 2)
        .map((row) => formatGroupLabel(activeDimension, row.name))
        .join(", ");
      const moreCount = Math.max(0, lowConfidenceGroups.length - 2);
      const tailText = moreCount > 0 ? ` and ${moreCount} more` : "";

      secondaryInsights.push({
        type: "warning",
        title: "Confidence Warning",
        description: `${lowConfidenceGroups.length} group(s) have fewer than ${MIN_CONFIDENCE_TRADES} trades (${sampleNames}${tailText}), so signal strength is weak.`,
        suggestion: "Collect more samples before making major decisions on these groups.",
      });
    }

    if (contribution) {
      const contributionLabel = formatGroupLabel(activeDimension, contribution.groupName);
      secondaryInsights.push({
        type: "warning",
        title: "Profit Contribution",
        description: `${contributionLabel} contributes ${formatMetric(contribution.contributionPct, "%")} of your total profit based on ${behaviorTrades.length} trades.`,
        suggestion: `Focus more on ${contributionLabel}.`,
      });
    }

    const primaryInsights = [keyInsight, strongEdgeMerged, weakPerformance, topBehaviorInsight].filter(
      Boolean,
    );

    return { primaryInsights, secondaryInsights };
  }, [rows, activeDimension, behaviorTrades]);

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
          <p className={styles.state}>No insights available for selected filters.</p>
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
