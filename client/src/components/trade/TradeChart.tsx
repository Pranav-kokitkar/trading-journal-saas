import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  CandlestickSeries,
  createSeriesMarkers,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type ISeriesApi as IAnySeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type UTCTimestamp,
} from "lightweight-charts";
import styles from "./TradeChart.module.css";
import { useHistoricalCandles } from "../../hooks/useHistoricalCandles";
import {
  buildTradeMarkers,
  buildTradeOverlayConfig,
  buildTradePriceLines,
  getNearestCandleTime,
  type TradeOverlayTrade,
} from "../../utils/chartOverlays";
import type {
  HistoricalCandle,
  TradeReplayTimeframe,
} from "../../utils/binanceDatafeed";
import { formatDateTimeUtc } from "../../utils/formatDateTimeUtc";

interface TradeChartProps {
  trade: TradeOverlayTrade;
}

const TIMEFRAME_OPTIONS: Array<{ value: TradeReplayTimeframe; label: string }> =
  [
    { value: "1D", label: "1D" },
    { value: "1W", label: "1W" },
    { value: "1M", label: "1M" },
    { value: "3M", label: "3M" },
    { value: "6M", label: "6M" },
    { value: "ALL", label: "All" },
  ];

const formatPrice = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 8 });
};

const toTimestamp = (value: number): UTCTimestamp => value as UTCTimestamp;

export const TradeChart = ({ trade }: TradeChartProps) => {
  const chartMountRef = useRef<HTMLDivElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<IAnySeriesApi<"Histogram"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<number> | null>(null);
  const drawFrameRef = useRef<number | null>(null);

  const [timeframe, setTimeframe] = useState<TradeReplayTimeframe>("1M");

  const { candles, loading, error, metadata } = useHistoricalCandles(
    trade,
    true,
    timeframe,
  );

  const overlay = useMemo(() => buildTradeOverlayConfig(trade), [trade]);
  const markers = useMemo(
    () => buildTradeMarkers(overlay, candles),
    [candles, overlay],
  );
  const priceLines = useMemo(() => buildTradePriceLines(overlay), [overlay]);
  const entryTimeOnChart = useMemo(
    () => getNearestCandleTime(candles, overlay.entryTime),
    [candles, overlay.entryTime],
  );

  const tradeKey = useMemo(
    () =>
      trade._id ??
      trade.id ??
      trade.tradeNumber ??
      `${trade.symbol ?? "trade"}`,
    [trade],
  );

  const drawOverlay = useCallback(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const canvas = overlayCanvasRef.current;
    const mount = chartMountRef.current;

    if (!chart || !series || !canvas || !mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    if (width <= 0 || height <= 0) return;

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * devicePixelRatio);
    canvas.height = Math.floor(height * devicePixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    const visibleRange = chart.timeScale().getVisibleRange();
    if (
      !visibleRange ||
      overlay.entryTime == null ||
      overlay.entryPrice == null
    )
      return;

    const entryCoordinate = chart
      .timeScale()
      .timeToCoordinate(toTimestamp(entryTimeOnChart ?? overlay.entryTime));
    if (entryCoordinate == null) return;

    const visibleEndCoordinate = chart
      .timeScale()
      .timeToCoordinate(visibleRange.to as UTCTimestamp);
    const lineEndCoordinate =
      visibleEndCoordinate == null
        ? width
        : Math.min(width, visibleEndCoordinate + 12);

    const drawGuide = (price: number | null, color: string, title: string) => {
      if (price == null) return;
      const y = series.priceToCoordinate(price);
      if (y == null) return;

      context.save();
      context.setLineDash([6, 6]);
      context.strokeStyle = color;
      context.globalAlpha = 0.9;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(entryCoordinate, y);
      context.lineTo(lineEndCoordinate, y);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = color;
      context.font = "600 11px Inter, ui-sans-serif, system-ui, sans-serif";
      context.fillText(
        `${title} ${formatPrice(price)}`,
        entryCoordinate + 10,
        y - 6,
      );
      context.restore();
    };

    drawGuide(overlay.entryPrice, "#7dd3fc", "Entry");
    drawGuide(overlay.stopLossPrice, "#f87171", "Stop");
    drawGuide(overlay.takeProfitPrice, "#4ade80", "TP");
    drawGuide(overlay.exitPrice, "#f5f7fb", "Exit");

    if (drawFrameRef.current != null) {
      cancelAnimationFrame(drawFrameRef.current);
    }

    drawFrameRef.current = requestAnimationFrame(() => {
      drawFrameRef.current = null;
    });
  }, [entryTimeOnChart, overlay]);

  useEffect(() => {
    const mount = chartMountRef.current;
    if (!mount) return;

    if (!candles.length) {
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      return;
    }

    const chart = createChart(mount, {
      autoSize: false,
      width: mount.clientWidth,
      height: mount.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(0, 0, 0, 0)" },
        textColor: "rgba(226, 232, 240, 0.9)",
        fontSize: 12,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.08)" },
        horzLines: { color: "rgba(148, 163, 184, 0.08)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.14)",
        scaleMargins: { top: 0.18, bottom: 0.18 },
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.14)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 16,
        fixLeftEdge: false,
        lockVisibleTimeRangeOnResize: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(96, 165, 250, 0.72)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "rgba(15, 23, 42, 0.95)",
        },
        horzLine: {
          color: "rgba(96, 165, 250, 0.72)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "rgba(15, 23, 42, 0.95)",
        },
      },
      localization: {
        dateFormat: "dd MMM 'yy",
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "rgba(74, 222, 128, 0.9)",
      downColor: "rgba(248, 113, 113, 0.9)",
      borderUpColor: "rgba(74, 222, 128, 1)",
      borderDownColor: "rgba(248, 113, 113, 1)",
      wickUpColor: "rgba(74, 222, 128, 0.95)",
      wickDownColor: "rgba(248, 113, 113, 0.95)",
      priceLineVisible: false,
      lastValueVisible: true,
      priceFormat: {
        type: "price",
        precision: 8,
        minMove: 0.00000001,
      },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "volume",
      priceFormat: {
        type: "volume",
      },
      color: "rgba(125, 211, 252, 0.42)",
      base: 0,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0.02 },
      visible: false,
    });

    const chartData = candles.map((candle: HistoricalCandle) => ({
      time: toTimestamp(candle.time),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const volumeData = candles.map((candle: HistoricalCandle) => ({
      time: toTimestamp(candle.time),
      value: candle.volume,
      color:
        candle.close >= candle.open
          ? "rgba(74, 222, 128, 0.28)"
          : "rgba(248, 113, 113, 0.28)",
    }));

    series.setData(chartData);
    volumeSeries.setData(volumeData);
    markersRef.current?.detach?.();
    markersRef.current = createSeriesMarkers(
      series,
      markers.map((marker) => ({
        time: toTimestamp(marker.time),
        position: marker.position,
        color: marker.color,
        shape: marker.shape,
        text: marker.text,
      })) as SeriesMarker<number>[],
    );

    priceLines.forEach((line) => {
      series.createPriceLine({
        price: line.price,
        color: line.color,
        lineWidth: line.lineWidth,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: line.title,
      });
    });

    chart.timeScale().fitContent();

    if (entryTimeOnChart != null) {
      const entryIndex = candles.findIndex(
        (candle) => candle.time === entryTimeOnChart,
      );
      const centerIndex =
        entryIndex >= 0 ? entryIndex : Math.floor(candles.length / 2);
      const windowBefore =
        candles[Math.max(0, centerIndex - 50)]?.time ?? candles[0].time;
      const windowAfter =
        candles[Math.min(candles.length - 1, centerIndex + 80)]?.time ??
        candles[candles.length - 1].time;

      chart.timeScale().setVisibleRange({
        from: toTimestamp(windowBefore),
        to: toTimestamp(windowAfter),
      });
    }

    chart.timeScale().subscribeVisibleTimeRangeChange(drawOverlay);
    chart.subscribeCrosshairMove(drawOverlay);

    chartRef.current = chart;
    seriesRef.current = series;
    volumeSeriesRef.current = volumeSeries;

    const resizeObserver = new ResizeObserver(() => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      chart.applyOptions({ width, height });
      drawOverlay();
    });

    resizeObserver.observe(mount);
    drawOverlay();

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(drawOverlay);
      chart.unsubscribeCrosshairMove(drawOverlay);
      resizeObserver.disconnect();
      markersRef.current?.detach?.();
      markersRef.current = null;
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      if (drawFrameRef.current != null) {
        cancelAnimationFrame(drawFrameRef.current);
        drawFrameRef.current = null;
      }
    };
  }, [candles, drawOverlay, entryTimeOnChart, markers, priceLines]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay, markers, priceLines]);

  const hasData = candles.length > 0;
  const isCryptoTrade = metadata?.symbol != null;

  return (
    <section className={styles.chartCard} aria-label="Historical trade chart">
      <div className={styles.chartHeader}>
        <div>
          <p className={styles.eyebrow}>Trade replay</p>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>
              {trade.symbol || "Trade"} historical view
            </h3>
            <div className={styles.meta}>
              {overlay.direction && (
                <span
                  className={`${styles.pill} ${overlay.direction === "long" ? styles.pillSuccess : styles.pillDanger}`}
                >
                  {overlay.direction.toUpperCase()}
                </span>
              )}
              {overlay.riskReward != null && (
                <span className={styles.pill}>
                  RR {overlay.riskReward.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.meta}>
          <span className={styles.pill}>
            Entry {formatDateTimeUtc(overlay.entryTime)}
          </span>
          {overlay.exitTime && (
            <span className={styles.pill}>
              Exit {formatDateTimeUtc(overlay.exitTime)}
            </span>
          )}
        </div>
      </div>

      <div className={styles.legend} aria-hidden="true">
        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "#7dd3fc" }}
          />
          Entry
        </span>
        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "#f87171" }}
          />
          Stop loss
        </span>
        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "#4ade80" }}
          />
          Take profit
        </span>
        <span className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: "#f5f7fb" }}
          />
          Exit
        </span>
      </div>

      <div className={styles.chartNote} role="note" aria-label="Chart caution">
        <span className={styles.chartNoteIcon} aria-hidden="true">
          !
        </span>
        <p className={styles.chartNoteText}>
          If the replay looks unusual, the trade timestamps or price levels may
          not line up perfectly with the source candles.
        </p>
      </div>

      <div className={styles.toolbarRow}>
        <div className={styles.toolbarGroup}>
          <span className={styles.toolbarLabel}>Timeframe</span>
          <div className={styles.toolbarButtons}>
            {TIMEFRAME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.toolButton} ${timeframe === option.value ? styles.toolButtonActive : ""}`}
                onClick={() => setTimeframe(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.chartFrame}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.skeleton} aria-hidden="true" />
          </div>
        ) : error && !hasData ? (
          <div className={styles.errorState}>
            <h4 className={styles.errorTitle}>
              Historical candles unavailable
            </h4>
            <p className={styles.errorText}>{error}</p>
          </div>
        ) : hasData ? (
          <>
            <div ref={chartMountRef} className={styles.chartMount} />
            <canvas ref={overlayCanvasRef} className={styles.overlayCanvas} />
          </>
        ) : (
          <div className={styles.emptyState}>
            <h4 className={styles.emptyTitle}>No historical candles found</h4>
            <p className={styles.emptyText}>
              {isCryptoTrade
                ? "Binance did not return candle data for the selected trade window."
                : "This trade does not map to a Binance crypto symbol yet, so the replay view cannot load historical candles."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
