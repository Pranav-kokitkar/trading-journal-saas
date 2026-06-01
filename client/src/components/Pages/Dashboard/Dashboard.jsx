// src/components/Pages/Dashboard/Dashboard.jsx
import { useContext } from "react";
import styles from "./dashboard.module.css";
import EquityCurveChart from "./EquityCurveChart";
import WinLossChart from "./WinLossChart";
import PnLChart from "./PnLChart";
import RiskChart from "./RiskChart";
import DirectionChart from "./DirectionChart";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

import { PerformanceContext } from "../../../context/PerformanceContext";
import { useTrades } from "../../../store/TradeContext"; 
import { UserContext } from "../../../context/UserContext";
import { AccountContext } from "../../../context/AccountContext";
import { SkeletonCard, SkeletonChart, SkeletonText } from "../../ui/skeleton/Skeleton";

const formatLabel = (value, fallback) => {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const normalizeDirection = (trade) => {
  const raw = String(trade?.tradeDirection || trade?.tradedirection || "").toLowerCase();
  if (raw === "buy" || raw === "long") return "Long";
  if (raw === "sell" || raw === "short") return "Short";
  return "Unknown";
};

const getTradeOutcome = (trade) => {
  const result = String(trade?.tradeResult || "").toLowerCase();
  if (result === "win") return "win";
  if (result === "loss") return "loss";
  const pnl = Number(trade?.pnl || 0);
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "breakeven";
};

const isCapitalTrade = (trade) => {
  const status = String(trade?.tradeStatus || "").toLowerCase().trim();
  if (status === "missed") return false;

  const tradeMode = String(
    trade?.tradeMode || trade?.tradeType || trade?.trade_type || "",
  )
    .toLowerCase()
    .trim();

  return tradeMode !== "backtest";
};

const buildKeyInsights = (trades) => {
  const groups = new Map();

  trades.forEach((trade) => {
    const pair = String(trade?.symbol || "").trim() || "Unknown Pair";
    const session = formatLabel(trade?.session, "Unknown Session");
    const direction = normalizeDirection(trade);
    const key = `${pair}__${session}__${direction}`;

    if (!groups.has(key)) {
      groups.set(key, {
        pair,
        session,
        direction,
        total: 0,
        wins: 0,
        totalPnL: 0,
      });
    }

    const group = groups.get(key);
    const pnl = Number(trade?.pnl || 0);
    const outcome = getTradeOutcome(trade);

    group.total += 1;
    if (outcome === "win") group.wins += 1;
    group.totalPnL += Number.isFinite(pnl) ? pnl : 0;
  });

  const ranked = Array.from(groups.values())
    .map((group) => ({
      ...group,
      winRate: group.total > 0 ? (group.wins / group.total) * 100 : 0,
    }))
    .filter((group) => group.total > 0);

  if (!ranked.length) {
    return { weakest: null, strongest: null };
  }

  const weakest = [...ranked].sort(
    (a, b) => a.winRate - b.winRate || a.totalPnL - b.totalPnL,
  )[0];

  const strongest = [...ranked].sort(
    (a, b) => b.winRate - a.winRate || b.totalPnL - a.totalPnL,
  )[0];

  return { weakest, strongest };
};

const formatPnl = (value) => {
  const amount = Number(value || 0);
  const sign = amount >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0.00";
  return `$${amount.toFixed(2)}`;
};

const formatPercent = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "0.00%";
  return `${amount.toFixed(2)}%`;
};

const buildSessionEdgeData = (trades) => {
  const grouped = new Map();

  trades.forEach((trade) => {
    const key = formatLabel(trade?.session, "Unknown Session");
    if (!grouped.has(key)) {
      grouped.set(key, {
        session: key,
        totalTrades: 0,
        wins: 0,
        totalPnL: 0,
      });
    }

    const current = grouped.get(key);
    const pnl = Number(trade?.pnl || 0);
    const outcome = getTradeOutcome(trade);

    current.totalTrades += 1;
    if (outcome === "win") current.wins += 1;
    current.totalPnL += Number.isFinite(pnl) ? pnl : 0;
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      winRate:
        item.totalTrades > 0 ? Number(((item.wins / item.totalTrades) * 100).toFixed(2)) : 0,
      totalPnL: Number(item.totalPnL.toFixed(2)),
    }))
    .sort((a, b) => b.totalTrades - a.totalTrades || b.totalPnL - a.totalPnL)
    .slice(0, 6);
};

const buildEfficiencyStats = (trades) => {
  const validDurations = trades
    .map((trade) => {
      const durationHours = Number(trade?.durationHours);
      if (Number.isFinite(durationHours) && durationHours > 0) {
        return durationHours;
      }

      const durationMinutes = Number(trade?.durationMinutes);
      if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
        return durationMinutes / 60;
      }

      return null;
    })
    .filter((value) => Number.isFinite(value) && value > 0);

  const avgDurationHours =
    validDurations.length > 0
      ? validDurations.reduce((sum, value) => sum + value, 0) / validDurations.length
      : 0;

  const bucket =
    avgDurationHours <= 0
      ? "No duration data"
      : avgDurationHours < 0.75
        ? "Scalping window"
        : avgDurationHours < 4
          ? "Intraday window"
          : avgDurationHours < 24
            ? "Swing window"
            : "Position window";

  return {
    averageDurationHours: avgDurationHours,
    bucket,
    sampledTrades: validDurations.length,
  };
};

export const Dashboard = () => {
  const { userDetails } = useContext(UserContext);
  const { performance } = useContext(PerformanceContext);
  const {accountDetails} = useContext(AccountContext);

  // Read trades from TradeContext (fallback to empty array)
  const {
    accountTrades = [],
    loading: chartsLoading = false,
  } = useTrades() || {};

  // Accept both "closed" and "exited" as finished trades (case-insensitive)
  const finishedStatuses = new Set(["closed", "exited"]);

  // Filter only capital trades for charts and performance-sensitive visuals
  const closedTrades = Array.isArray(accountTrades)
    ? accountTrades.filter((t) =>
        finishedStatuses.has(String(t.tradeStatus || "").toLowerCase()) &&
        isCapitalTrade(t)
      )
    : [];

  const hasEnoughInsightData = closedTrades.length >= 10;
  const { weakest, strongest } = buildKeyInsights(closedTrades);
  const sessionEdgeData = buildSessionEdgeData(closedTrades);
  const efficiencyStats = buildEfficiencyStats(closedTrades);


  if (!userDetails) {
    return <DashboardLoadingState />;
  }

  return (
    <section className={`${styles.dashboard} app-page`}>
      <TradingDashboard accountDetails={accountDetails} performance={performance} />

      <section className={styles.insightsSection}>
        <h2>
          Key <span className={styles.span}>Insights</span>
        </h2>

        {!hasEnoughInsightData ? (
          <div className={styles.insightFallback}>
            Not enough data to generate insights yet
          </div>
        ) : (
          <div className={styles.insightsGrid}>
            <article className={styles.insightCard}>
              <h3>Weakest Pattern</h3>
              <p className={styles.insightMeta}>
                {weakest?.pair || "Unknown Pair"} — {weakest?.session || "Unknown Session"} — {weakest?.direction || "Unknown"}
              </p>
              <p className={styles.insightValue}>
                Win Rate: <span>{(weakest?.winRate || 0).toFixed(0)}%</span>
              </p>
              <p className={styles.insightValue}>
                Total PnL: <span className={(weakest?.totalPnL || 0) < 0 ? styles.loss : styles.profit}>{formatPnl(weakest?.totalPnL)}</span>
              </p>
              <p className={styles.insightNote}>
                → Avoid this setup — it is reducing your performance
              </p>
            </article>

            <article className={styles.insightCard}>
              <h3>Strongest Edge</h3>
              <p className={styles.insightMeta}>
                {strongest?.pair || "Unknown Pair"} — {strongest?.session || "Unknown Session"} — {strongest?.direction || "Unknown"}
              </p>
              <p className={styles.insightValue}>
                Win Rate: <span>{(strongest?.winRate || 0).toFixed(0)}%</span>
              </p>
              <p className={styles.insightValue}>
                Total PnL: <span className={(strongest?.totalPnL || 0) < 0 ? styles.loss : styles.profit}>{formatPnl(strongest?.totalPnL)}</span>
              </p>
              <p className={styles.insightNote}>
                → Keep executing this setup — it is strengthening your performance
              </p>
            </article>
          </div>
        )}
      </section>

      <div className={styles.sectionHeader}>
        <h2>
          Trading <span className={styles.span}>Performance</span>
        </h2>
      </div>

      <div className={styles.tradingperformance}>
        <div className={styles.chartCard}>
          <h3>Equity Curve</h3>
          {chartsLoading ? (
            <SkeletonChart height={280} showLegend={false} />
          ) : (
            <EquityCurveChart trades={closedTrades} />
          )}
        </div>

        <div className={styles.chartCard}>
          <h3>Win / Loss</h3>
          {chartsLoading ? (
            <SkeletonChart height={280} showLegend={false} />
          ) : (
            <WinLossChart trades={closedTrades} />
          )}
        </div>

        <div className={styles.chartCard}>
          <h3>PnL Per Trade</h3>
          {chartsLoading ? (
            <SkeletonChart height={280} showLegend={false} />
          ) : (
            <PnLChart trades={closedTrades} />
          )}
        </div>

        <div className={styles.chartCard}>
          <h3>Risk Overview</h3>
          {chartsLoading ? (
            <SkeletonChart height={280} showLegend={false} />
          ) : (
            <RiskChart trades={closedTrades} />
          )}
        </div>

        <div className={styles.chartCard}>
          <h3>Direction Success</h3>
          {chartsLoading ? (
            <SkeletonChart height={280} showLegend={false} />
          ) : (
            <DirectionChart trades={closedTrades} />
          )}
        </div>
      </div>

      <section className={styles.advancedSection}>
        <div className={styles.sectionHeader}>
          <h2>
            Advanced <span className={styles.span}>Performance Signals</span>
          </h2>
        </div>

        <div className={styles.advancedGrid}>
          <article className={styles.chartCard}>
            <h3>Session Edge Breakdown</h3>
            {sessionEdgeData.length === 0 ? (
              <p className={styles.chartLoadingText}>No session data available yet.</p>
            ) : (
              <div className={styles.sessionChartWrap}>
                <ResponsiveContainer width="100%" height={290}>
                  <BarChart data={sessionEdgeData} margin={{ top: 8, right: 12, left: 6, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
                    <XAxis
                      dataKey="session"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      padding={{ left: 8, right: 8 }}
                    />
                    <YAxis
                      yAxisId="pnl"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis
                      yAxisId="win"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--chart-tooltip-bg)",
                        border: "1px solid var(--chart-tooltip-border)",
                        borderRadius: "12px",
                      }}
                      formatter={(value, name) => {
                        if (name === "Win Rate") return [`${Number(value).toFixed(2)}%`, name];
                        return [formatCurrency(value), name];
                      }}
                    />
                    <Bar yAxisId="pnl" dataKey="totalPnL" name="PnL" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} />
                    <Bar yAxisId="win" dataKey="winRate" name="Win Rate" fill="var(--color-profit)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          <article className={styles.chartCard}>
            <h3>Trade Efficiency Tracker</h3>
            <div className={styles.efficiencyGrid}>
              <div className={styles.efficiencyItem}>
                <span>Average Trade Duration</span>
                <strong>{efficiencyStats.averageDurationHours > 0 ? `${efficiencyStats.averageDurationHours.toFixed(2)}h` : "—"}</strong>
              </div>
              <div className={styles.efficiencyItem}>
                <span>Holding Window</span>
                <strong>{efficiencyStats.bucket}</strong>
              </div>
              <div className={styles.efficiencyItem}>
                <span>Duration Samples</span>
                <strong>{efficiencyStats.sampledTrades}</strong>
              </div>
              <div className={styles.efficiencyItem}>
                <span>Expectancy / Trade</span>
                <strong>{formatCurrency(performance.expectancyPnL)}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

    </section>
  );
};

const DashboardLoadingState = () => {
  return (
    <section className={`${styles.dashboard} app-page`}>
      <header className={`${styles.pageHero} app-page-heading`}>
        <SkeletonText className={styles.skeletonTitle} lines={1} width="260px" height={28} />

        <div className={styles.tradingdata}>
          <div className={styles.tradingdatal}>
            <SkeletonCard className={styles.metricSkeletonCard} rows={1} withHeader={false} />
            <SkeletonCard className={styles.metricSkeletonCard} rows={1} withHeader={false} />
            <SkeletonCard className={styles.metricSkeletonCard} rows={1} withHeader={false} />
            <SkeletonCard className={styles.metricSkeletonCard} rows={1} withHeader={false} />
          </div>

          <div className={styles.tradingdatar}>
            <SkeletonText lines={6} width={["55%", "100%", "92%", "100%", "86%", "72%"]} />
          </div>
        </div>
      </header>

      <div className={styles.sectionHeader}>
        <SkeletonText lines={1} width="220px" height={24} />
        <SkeletonCard className={styles.toggleSkeleton} rows={1} withHeader={false} />
      </div>

      <div className={styles.tradingperformance}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={`dashboard-skeleton-chart-${index}`} className={styles.chartCard}>
            <SkeletonText lines={1} width="50%" height={18} />
            <SkeletonChart height={280} showLegend={false} />
          </div>
        ))}
      </div>
    </section>
  );
};

const TradingDashboard = ({ accountDetails, performance }) => {
  const initialCapital = Number(accountDetails?.initialCapital || 0);
  const totalPnl = Number(performance.totalPnL || 0);
  const growthPercent = initialCapital > 0 ? (totalPnl / initialCapital) * 100 : 0;

  const kpiCards = [
    {
      label: "Total Trades",
      value: performance.totalTrades,
      toneClass: styles.kpiBlue,
    },
    {
      label: "Win Rate",
      value: `${Number(performance.winRate || 0).toFixed(2)}%`,
      toneClass: styles.kpiGreen,
    },
    {
      label: "Total PnL",
      value: formatCurrency(performance.totalPnL),
      toneClass:
        Number(performance.totalPnL || 0) >= 0 ? styles.kpiGreen : styles.kpiRed,
      growthBadge:
        initialCapital > 0
          ? {
              label: `${growthPercent >= 0 ? "+" : ""}${formatPercent(growthPercent)}`,
              positive: growthPercent >= 0,
            }
          : null,
    },
    {
      label: "Average RR",
      value: `1:${Number(performance.averageRR || 0).toFixed(2)}R`,
      toneClass: styles.kpiAmber,
    },
  ];

  return (
    <header className={`${styles.pageHero} app-page-heading`}>
      <div className={styles.dashboardHeaderRow}>
        <h1 className="app-page-title">
          Trading <span className={styles.span}>Dashboard</span>
        </h1>
      </div>
      <div className={styles.kpiGrid}>
        {kpiCards.map((item) => (
          <article key={item.label} className={`${styles.kpiCard} ${item.toneClass}`}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
            {item.growthBadge ? (
              <span
                className={`${styles.growthBadge} ${item.growthBadge.positive ? styles.growthBadgePositive : styles.growthBadgeNegative}`}
              >
                Growth {item.growthBadge.label}
              </span>
            ) : null}
          </article>
        ))}
      </div>

      <div className={styles.overviewCard}>
        <h2>Account &amp; Portfolio Overview</h2>
        <div className={styles.overviewGrid}>
          <div className={styles.overviewItem}>
            <span>Initial Capital</span>
            <strong>{formatCurrency(accountDetails?.initialCapital || 0)}</strong>
          </div>
          <div className={styles.overviewItem}>
            <span>Current Balance</span>
            <strong>{formatCurrency(accountDetails?.currentBalance || 0)}</strong>
          </div>
          <div className={styles.overviewItem}>
            <span>Total Return</span>
            <strong
              className={
                Number(performance.totalPnL || 0) > 0
                  ? styles.profit
                  : Number(performance.totalPnL || 0) < 0
                    ? styles.loss
                    : styles.neutral
              }
            >
              {formatCurrency(performance.totalPnL)}
            </strong>
          </div>
          <div className={styles.overviewItem}>
            <span>Expectancy</span>
            <strong>{`${Number(performance.expectancyRR || 0).toFixed(2)}R / ${formatCurrency(performance.expectancyPnL)}`}</strong>
          </div>
        </div>
      </div>
    </header>
  );
};
