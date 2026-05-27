import {
  getNumericField,
  getTradeDirection,
  getTradeEntryTimestamp,
  getTradeExitTimestamp,
} from "./binanceDatafeed";

export interface TradeOverlayTrade {
  _id?: string | number;
  id?: string | number;
  tradeNumber?: string | number;
  symbol?: string;
  marketType?: string;
  tradeDirection?: string;
  tradedirection?: string;
  entryPrice?: string | number;
  stoplossPrice?: string | number;
  takeProfitPrice?: string | number;
  exitPrice?: string | number;
  exitedPrice?: Array<{ price?: string | number; volume?: string | number }>;
  exitTime?: string | number | Date;
  entryTime?: string | number | Date;
  dateTime?: string | number | Date;
  dateNtime?: string | number | Date;
  tradeDate?: string | number | Date;
}

export interface TradeOverlayBand {
  id: "stopLoss" | "takeProfit";
  label: string;
  fromPrice: number;
  toPrice: number;
  fillColor: string;
  strokeColor: string;
}

export interface TradeOverlayConfig {
  tradeId: string;
  symbol: string;
  direction: "long" | "short" | null;
  entryPrice: number | null;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  entryTime: number | null;
  exitTime: number | null;
  exitPrice: number | null;
  riskReward: number | null;
  bands: TradeOverlayBand[];
}

export interface TradeMarker {
  time: number;
  position: "aboveBar" | "belowBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text: string;
}

export const buildTradeOverlayConfig = (
  trade: TradeOverlayTrade,
): TradeOverlayConfig => {
  const direction = getTradeDirection(trade);
  const entryPrice = getNumericField(trade.entryPrice);
  const stopLossPrice = getNumericField(trade.stoplossPrice);
  const takeProfitPrice = getNumericField(trade.takeProfitPrice);
  const exitPrice = getNumericField(trade.exitPrice);
  const entryTime = getTradeEntryTimestamp(trade);
  const exitTime = getTradeExitTimestamp(trade);
  const symbol = (trade.symbol ?? "").toString().toUpperCase();

  const bands: TradeOverlayBand[] = [];

  if (entryPrice != null && stopLossPrice != null) {
    const lower = Math.min(entryPrice, stopLossPrice);
    const upper = Math.max(entryPrice, stopLossPrice);
    bands.push({
      id: "stopLoss",
      label: "Stop loss zone",
      fromPrice: lower,
      toPrice: upper,
      fillColor: "rgba(248, 113, 113, 0.14)",
      strokeColor: "rgba(248, 113, 113, 0.65)",
    });
  }

  if (entryPrice != null && takeProfitPrice != null) {
    const lower = Math.min(entryPrice, takeProfitPrice);
    const upper = Math.max(entryPrice, takeProfitPrice);
    bands.push({
      id: "takeProfit",
      label: "Take profit zone",
      fromPrice: lower,
      toPrice: upper,
      fillColor: "rgba(74, 222, 128, 0.14)",
      strokeColor: "rgba(74, 222, 128, 0.7)",
    });
  }

  let riskReward: number | null = null;
  if (entryPrice != null && stopLossPrice != null && takeProfitPrice != null) {
    const risk = Math.abs(entryPrice - stopLossPrice);
    const reward = Math.abs(takeProfitPrice - entryPrice);
    riskReward = risk > 0 ? reward / risk : null;
  }

  let resolvedExitPrice = exitPrice;
  if (
    resolvedExitPrice == null &&
    Array.isArray((trade as TradeOverlayTrade).exitedPrice)
  ) {
    const exits = (trade as TradeOverlayTrade).exitedPrice
      .map((level) => {
        const price = getNumericField(level.price);
        const volume = getNumericField(level.volume);
        if (price == null) return null;
        return { price, volume: volume ?? 0 };
      })
      .filter(Boolean) as Array<{ price: number; volume: number }>;

    if (exits.length > 0) {
      const weightedVolume = exits.reduce(
        (sum, level) => sum + (level.volume > 0 ? level.volume : 0),
        0,
      );
      resolvedExitPrice =
        weightedVolume > 0
          ? exits.reduce(
              (sum, level) =>
                sum + level.price * (level.volume > 0 ? level.volume : 0),
              0,
            ) / weightedVolume
          : exits[0].price;
    }
  }

  return {
    tradeId: String(
      trade._id ?? trade.id ?? trade.tradeNumber ?? symbol ?? "trade",
    ),
    symbol,
    direction,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    entryTime,
    exitTime,
    exitPrice: resolvedExitPrice,
    riskReward,
    bands,
  };
};

export const getNearestCandleTime = (
  candles: Array<{ time: number }>,
  targetTime: number | null,
): number | null => {
  if (!candles.length || !targetTime) return targetTime;

  let nearestTime = candles[0].time;
  let smallestDelta = Math.abs(candles[0].time * 1000 - targetTime);

  for (const candle of candles) {
    const delta = Math.abs(candle.time * 1000 - targetTime);
    if (delta < smallestDelta) {
      smallestDelta = delta;
      nearestTime = candle.time;
    }
  }

  return nearestTime;
};

export const buildTradeMarkers = (
  config: TradeOverlayConfig,
  candles: Array<{ time: number }>,
): TradeMarker[] => {
  const markers: TradeMarker[] = [];
  const entryMarkerTime = getNearestCandleTime(candles, config.entryTime);
  const exitMarkerTime = getNearestCandleTime(candles, config.exitTime);

  if (entryMarkerTime != null) {
    markers.push({
      time: entryMarkerTime,
      position: config.direction === "short" ? "aboveBar" : "belowBar",
      color: config.direction === "short" ? "#f87171" : "#4ade80",
      shape: config.direction === "short" ? "arrowDown" : "arrowUp",
      text: "Entry",
    });
  }

  if (exitMarkerTime != null) {
    markers.push({
      time: exitMarkerTime,
      position: config.direction === "short" ? "belowBar" : "aboveBar",
      color: "#7dd3fc",
      shape: "circle",
      text: "Exit",
    });
  }

  return markers;
};

export const buildTradePriceLines = (config: TradeOverlayConfig) => {
  const lines: Array<{
    price: number;
    color: string;
    title: string;
    lineWidth: number;
    lineStyle: number;
  }> = [];

  if (config.entryPrice != null) {
    lines.push({
      price: config.entryPrice,
      color: "#7dd3fc",
      title: "Entry",
      lineWidth: 2,
      lineStyle: 2,
    });
  }

  if (config.stopLossPrice != null) {
    lines.push({
      price: config.stopLossPrice,
      color: "#f87171",
      title: "Stop loss",
      lineWidth: 2,
      lineStyle: 2,
    });
  }

  if (config.takeProfitPrice != null) {
    lines.push({
      price: config.takeProfitPrice,
      color: "#4ade80",
      title: "Take profit",
      lineWidth: 2,
      lineStyle: 2,
    });
  }

  if (config.exitPrice != null) {
    lines.push({
      price: config.exitPrice,
      color: "#f5f7fb",
      title: "Exit",
      lineWidth: 2,
      lineStyle: 2,
    });
  }

  return lines;
};
