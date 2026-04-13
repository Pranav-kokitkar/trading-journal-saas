import styles from "./Skeleton.module.css";

const joinClassNames = (...classes) => classes.filter(Boolean).join(" ");

const SkeletonBlock = ({ className = "", style = {} }) => (
  <div aria-hidden="true" className={joinClassNames(styles.base, className)} style={style} />
);

export const SkeletonText = ({ lines = 1, width = "100%", height = 12, className = "" }) => {
  const normalizedWidth = Array.isArray(width)
    ? width
    : Array.from({ length: lines }, (_, index) => (index === lines - 1 ? "72%" : width));

  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock
          key={`skeleton-text-${index}`}
          className={styles.text}
          style={{
            width: normalizedWidth[index] || width,
            height,
            marginBottom: index === lines - 1 ? 0 : "var(--space-2)",
          }}
        />
      ))}
    </div>
  );
};

export const SkeletonInput = ({ className = "", height = 40 }) => (
  <SkeletonBlock className={joinClassNames(styles.input, className)} style={{ height }} />
);

export const SkeletonCard = ({ className = "", rows = 3, withHeader = true }) => (
  <div className={joinClassNames(styles.card, className)} aria-hidden="true">
    {withHeader && <SkeletonBlock className={styles.text} style={{ width: "46%", height: 14 }} />}
    <SkeletonText lines={rows} width={["100%", "92%", "64%"]} />
  </div>
);

export const SkeletonChart = ({ className = "", height = 280, showLegend = true }) => (
  <div className={joinClassNames(styles.chart, className)} style={{ minHeight: height }} aria-hidden="true">
    {showLegend ? (
      <div className={styles.chartLegend}>
        <SkeletonBlock className={styles.chartLegendItem} />
        <SkeletonBlock className={styles.chartLegendItem} />
      </div>
    ) : null}
    <SkeletonBlock className={styles.chartBody} style={{ minHeight: Math.max(180, height - 40) }} />
  </div>
);

export const SkeletonTableRow = ({ columns = 6, className = "" }) => (
  <div
    className={joinClassNames(styles.tableRow, className)}
    style={{ "--skeleton-columns": columns }}
    aria-hidden="true"
  >
    {Array.from({ length: columns }).map((_, index) => (
      <SkeletonBlock
        key={`skeleton-table-cell-${index}`}
        className={styles.tableCell}
        style={{ width: index === 0 ? "72%" : "88%" }}
      />
    ))}
  </div>
);