import React from "react";
import styles from "./Compare.module.css";

export const DatasetCard = ({ 
  dataset, 
  stats, 
  sampleSize, 
  dimensionsText,
  formatMetricValue 
}) => {
  return (
    <div className={styles.datasetCard}>
      <div className={styles.datasetHeader}>
        <div className={styles.datasetLetter}>{dataset}</div>
        <div className={styles.datasetInfo}>
          <h4>Dataset {dataset}</h4>
          <p className={styles.sampleSize}>{sampleSize} trades</p>
          <p className={styles.selectedDimensions}>{dimensionsText}</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Total Trades</div>
          <div className={styles.statValue}>{stats.totalTrades}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>Win Rate (Closed Trades)</div>
          <div className={`${styles.statValue} ${styles.positive}`}>
            {stats.winRate}%
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>Wins / Losses / Live</div>
          <div className={styles.statValue}>
            {stats.wins} / {stats.losses} /{" "}
            <span className={styles.liveCount}>{stats.liveTrades || 0}</span>
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>Expectancy</div>
          <div className={`${styles.statValue} ${styles.neutral}`}>
            {formatMetricValue(stats.expectancy) === "—"
              ? "—"
              : `$${formatMetricValue(stats.expectancy)} / ${formatMetricValue(stats.expectancyR)}R`}
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>Average Win</div>
          <div className={`${styles.statValue} ${styles.positive}`}>
            {formatMetricValue(stats.avgWinPnL) === "—"
              ? "—"
              : `$${formatMetricValue(stats.avgWinPnL)} / ${formatMetricValue(stats.avgWin)}R`}
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>Average Loss</div>
          <div className={`${styles.statValue} ${styles.negative}`}>
            {formatMetricValue(stats.avgLossPnL) === "—"
              ? "—"
              : `$${formatMetricValue(stats.avgLossPnL)} / ${formatMetricValue(stats.avgLoss)}R`}
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>Risk Reward Ratio</div>
          <div className={`${styles.statValue} ${styles.neutral}`}>
            {formatMetricValue(stats.riskRewardRatio)}
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>Profit Factor</div>
          <div className={`${styles.statValue} ${styles.positive}`}>
            {formatMetricValue(stats.profitFactor)}
          </div>
        </div>
      </div>
    </div>
  );
};
