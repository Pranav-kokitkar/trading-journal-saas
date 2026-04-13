// src/components/Pages/Dashboard/Dashboard.jsx
import { useContext } from "react";
import styles from "./dashboard.module.css";
import EquityCurveChart from "./EquityCurveChart";
import WinLossChart from "./WinLossChart";
import PnLChart from "./PnLChart";
import RiskChart from "./RiskChart";
import DirectionChart from "./DirectionChart";

import { PerformanceContext } from "../../../context/PerformanceContext";
import { useTrades } from "../../../store/TradeContext"; 
import { FiActivity, FiTrendingUp, FiTarget } from "react-icons/fi";
import { FaTrophy, FaPercentage } from "react-icons/fa";
import { UserContext } from "../../../context/UserContext";
import { AccountContext } from "../../../context/AccountContext";
import { SkeletonCard, SkeletonChart, SkeletonText } from "../../ui/skeleton/Skeleton";

export const Dashboard = () => {
  const { userDetails } = useContext(UserContext);
  const { performance } = useContext(PerformanceContext);
  const {accountDetails} = useContext(AccountContext);

  // Read trades from TradeContext (fallback to empty array)
  const {
    accountTrades = [],
    includeImportedTrades,
    setIncludeImportedTrades,
    loading: chartsLoading = false,
  } = useTrades() || {};

  // Accept both "closed" and "exited" as finished trades (case-insensitive)
  const finishedStatuses = new Set(["closed", "exited"]);

  // Filter closed/exited trades only for charts and performance-sensitive visuals
  const closedTrades = Array.isArray(accountTrades)
    ? accountTrades.filter((t) =>
        finishedStatuses.has(String(t.tradeStatus || "").toLowerCase())
      )
    : [];


  if (!userDetails) {
    return <DashboardLoadingState />;
  }

  return (
    <section className={`${styles.dashboard} app-page`}>
      <TradingDashboard accountDetails={accountDetails} performance={performance} />

      <div className={styles.sectionHeader}>
        <h2>
          Trading <span className={styles.span}>Performance</span>
        </h2>
        <div className={styles.controlsBar}>
          <label className={styles.checkboxLabel}>
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
  return (
    <header className={`${styles.pageHero} app-page-heading`}>
      <h1 className="app-page-title">
        Trading <span className={styles.span}>Dashboard</span>
      </h1>
      <div className={styles.tradingdata}>
        {/* Left side */}
        <div className={styles.tradingdatal}>
          <h3>
            <FiActivity className={`${styles.icon} ${styles.iconBlue}`} />
            Total Trades:{" "}
            <span className={styles.blue}>{performance.totalTrades}</span>
          </h3>

          <h3>
            <FaTrophy className={`${styles.icon} ${styles.iconGreen}`} />
            Win Rate:{" "}
            <span
              className={
                performance.totalPnL > 0
                  ? styles.profit
                  : performance.totalPnL < 0
                  ? styles.loss
                  : styles.neutral
              }
            >
              {performance.winRate}%
            </span>
          </h3>

          <h3>
            <FiTrendingUp className={`${styles.icon} ${styles.iconGreen}`} />
            Total PnL:{" "}
            <span
              className={
                performance.totalPnL > 0
                  ? styles.profit
                  : performance.totalPnL < 0
                  ? styles.loss
                  : styles.neutral
              }
            >
              ${performance.totalPnL}
            </span>
          </h3>

          <h3>
            <FiTarget className={`${styles.icon} ${styles.iconYellow}`} />
            Average RR:{" "}
            <span className={styles.yellow}>1:{performance.averageRR}R</span>
          </h3>
        </div>

        {/* Right side */}
        <div className={styles.tradingdatar}>
          <h2>Performance Metrics</h2>

          <h3>
            <FiTrendingUp className={`${styles.icon} ${styles.iconGreen}`} />
            Total Return:{" "}
            <span
              className={
                performance.totalPnL > 0
                  ? styles.profit
                  : performance.totalPnL < 0
                  ? styles.loss
                  : styles.neutral
              }
            >
              ${performance.totalPnL}
            </span>
          </h3>

          <h3>
            <FaTrophy className={`${styles.icon} ${styles.iconBlue}`} />
            Expectancy:{" "}
            <span className={styles.blue}>
              {performance.expectancyRR}R / {performance.expectancyPnL}$
            </span>
          </h3>

          <h3>
            <FaPercentage className={`${styles.icon} ${styles.iconYellow}`} />
            Total Risk:{" "}
            <span className={styles.yellow}>${performance.totalRisk}</span>
          </h3>

          <div className={styles.linecontainer}>
            <div className={styles.line}></div>
          </div>

          <h2>Quick Stats</h2>
          <h3>
            Initial Capital:{" "}
            <span>
              $
              {accountDetails?.initialCapital != null
                ? Number(accountDetails.initialCapital).toFixed(2)
                : "—"}
            </span>
          </h3>
          <h3>
            Current Balance:{" "}
            <span>
              $
              {accountDetails?.initialCapital != null
                ? Number(accountDetails.currentBalance).toFixed(2)
                : "—"}
            </span>
          </h3>
        </div>
      </div>
    </header>
  );
};
