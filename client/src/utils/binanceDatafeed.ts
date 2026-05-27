export type BinanceInterval =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d";

export interface TradeLike {
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
  entryTime?: string | number | Date;
  exitTime?: string | number | Date;
  dateTime?: string | number | Date;
  dateNtime?: string | number | Date;
  tradeDate?: string | number | Date;
}

export interface HistoricalCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalCandleResult {
  provider: "binance" | "yahoo";
  symbol: string | null;
  interval: string | null;
  entryTime: number | null;
  exitTime: number | null;
  windowStart: number | null;
  windowEnd: number | null;
  candles: HistoricalCandle[];
  reason?: string;
}

import { API_BASE_URL } from "../config/api";

const BINANCE_PROXY_URL = `${API_BASE_URL}/market-data/binance/klines`;
const YAHOO_PROXY_URL = `${API_BASE_URL}/market-data/yahoo/chart`;

const INTERVAL_SECONDS: Record<BinanceInterval, number> = {
  "1m": 60,
  "3m": 180,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "2h": 7200,
  "4h": 14400,
  "6h": 21600,
  "8h": 28800,
  "12h": 43200,
  "1d": 86400,
};

const SUPPORTED_QUOTES = [
  "USDT",
  "USDC",
  "FDUSD",
  "BUSD",
  "BTC",
  "ETH",
  "BNB",
  "TRY",
  "EUR",
];
const FX_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "NZD",
  "CAD",
  "CHF",
  "CNY",
  "HKD",
  "SEK",
  "NOK",
  "SGD",
  "MXN",
  "ZAR",
  "TRY",
  "PLN",
  "CZK",
  "HUF",
];

const COMMON_METAL_OR_INDEX_SYMBOLS = [
  "XAUUSD",
  "XAGUSD",
  "XPTUSD",
  "XPDUSD",
  "US30",
  "NAS100",
  "SPX500",
  "UK100",
  "GER40",
  "GER30",
  "JP225",
  "AUS200",
  "FRA40",
  "EU50",
];

type MarketProvider = "binance" | "yahoo";
export type TradeReplayTimeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "ALL";

const REPLAY_TIMEFRAME_MULTIPLIER: Record<TradeReplayTimeframe, number> = {
  "1D": 1,
  "1W": 3,
  "1M": 6,
  "3M": 10,
  "6M": 14,
  ALL: 18,
};

const YAHOO_INTERVAL_MAP: Record<BinanceInterval, string> = {
  "1m": "1m",
  "3m": "5m",
  "5m": "5m",
  "15m": "15m",
  "30m": "30m",
  "1h": "60m",
  "2h": "60m",
  "4h": "60m",
  "6h": "60m",
  "8h": "60m",
  "12h": "60m",
  "1d": "1d",
};

const YAHOO_INTERVAL_SECONDS: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "60m": 3600,
  "1d": 86400,
};

const toNumber = (value: unknown): number | null => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const parseTimestamp = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (typeof value === "number") {
    return value > 1e12 ? value : value * 1000;
  }

  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};

const isRecentEnoughForIntraday = (entryTime: number) => {
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
  return Date.now() - entryTime <= sixtyDaysMs;
};

const isForexPairSymbol = (symbol: string) => {
  const normalized = symbol.replace(/[^A-Z]/g, "");
  if (normalized.length !== 6) return false;

  const base = normalized.slice(0, 3);
  const quote = normalized.slice(3, 6);
  return FX_CURRENCIES.includes(base) && FX_CURRENCIES.includes(quote);
};

const isForexTrade = (trade: TradeLike | null | undefined) => {
  const marketType = (trade?.marketType ?? "").toString().toLowerCase();
  if (marketType.includes("forex")) return true;
  const rawSymbol = (trade?.symbol ?? "").toString().trim().toUpperCase();
  return isForexPairSymbol(rawSymbol.replace(/[^A-Z0-9/]/g, ""));
};

const isStockTrade = (trade: TradeLike | null | undefined) => {
  const marketType = (trade?.marketType ?? "").toString().toLowerCase();
  return marketType.includes("stock") || marketType.includes("equity");
};

const resolveMarketProvider = (
  trade: TradeLike | null | undefined,
): MarketProvider | null => {
  if (!trade?.symbol) return null;
  if ((trade.marketType ?? "").toString().toLowerCase().includes("crypto"))
    return "binance";
  if (isForexTrade(trade) || isStockTrade(trade)) return "yahoo";
  return null;
};

export const getTradeEntryTimestamp = (
  trade: TradeLike | null | undefined,
): number | null =>
  parseTimestamp(
    trade?.entryTime ?? trade?.dateTime ?? trade?.dateNtime ?? trade?.tradeDate,
  );

export const getTradeExitTimestamp = (
  trade: TradeLike | null | undefined,
): number | null => parseTimestamp(trade?.exitTime ?? null);

export const getTradeDirection = (
  trade: TradeLike | null | undefined,
): "long" | "short" | null => {
  const direction = (trade?.tradeDirection ?? trade?.tradedirection ?? "")
    .toString()
    .trim()
    .toLowerCase();

  if (["long", "buy"].includes(direction)) return "long";
  if (["short", "sell"].includes(direction)) return "short";
  return null;
};

export const getNumericField = (value: unknown): number | null =>
  toNumber(value);

export const normalizeBinanceSymbol = (
  trade: TradeLike | null | undefined,
): string | null => {
  const rawSymbol = (trade?.symbol ?? "").toString().trim().toUpperCase();
  if (!rawSymbol) return null;

  const normalized = rawSymbol.replace(/[^A-Z0-9/]/g, "");
  if (normalized.includes("/")) {
    const pair = normalized.replace("/", "");
    if (!pair.length) return null;
    if (pair.endsWith("USD") && !pair.endsWith("USDT")) {
      return `${pair.slice(0, -3)}USDT`;
    }
    return pair;
  }

  if (SUPPORTED_QUOTES.some((quote) => normalized.endsWith(quote))) {
    return normalized;
  }

  const marketType = (trade?.marketType ?? "").toString().toLowerCase();
  if (!marketType.includes("crypto")) return null;

  if (normalized.endsWith("USD") && !normalized.endsWith("USDT")) {
    return `${normalized.slice(0, -3)}USDT`;
  }

  return `${normalized}USDT`;
};

const normalizeYahooSymbol = (
  trade: TradeLike | null | undefined,
): string | null => {
  const rawSymbol = (trade?.symbol ?? "").toString().trim().toUpperCase();
  if (!rawSymbol) return null;

  const normalized = rawSymbol.replace(/\s+/g, "").replace(/\//g, "");
  if (!normalized) return null;

  if (isForexTrade(trade)) {
    if (normalized.endsWith("=X")) return normalized;
    return `${normalized}=X`;
  }

  return normalized;
};

export const resolveBinanceInterval = (
  entryTime: number,
  exitTime: number | null,
): BinanceInterval => {
  const durationMs = Math.max(
    0,
    (exitTime ?? entryTime + 6 * 60 * 60 * 1000) - entryTime,
  );
  const durationHours = durationMs / (60 * 60 * 1000);

  if (durationHours <= 6) return "5m";
  if (durationHours <= 24) return "15m";
  if (durationHours <= 72) return "1h";
  if (durationHours <= 240) return "4h";
  return "1d";
};

export const resolveYahooInterval = (
  trade: TradeLike | null | undefined,
  entryTime: number,
  exitTime: number | null,
): string => {
  const durationMs = Math.max(
    0,
    (exitTime ?? entryTime + 6 * 60 * 60 * 1000) - entryTime,
  );
  const durationHours = durationMs / (60 * 60 * 1000);
  const recent = isRecentEnoughForIntraday(entryTime);

  if (!recent) {
    return "1d";
  }

  if (durationHours <= 6) return YAHOO_INTERVAL_MAP["5m"];
  if (durationHours <= 24) return YAHOO_INTERVAL_MAP["15m"];
  if (durationHours <= 72) return YAHOO_INTERVAL_MAP["30m"];
  return YAHOO_INTERVAL_MAP["1h"];
};

export const buildHistoricalWindow = (
  entryTime: number,
  exitTime: number | null,
  interval: BinanceInterval,
  timeframe: TradeReplayTimeframe = "1M",
) => {
  return buildHistoricalWindowBySeconds(
    entryTime,
    exitTime,
    INTERVAL_SECONDS[interval],
    REPLAY_TIMEFRAME_MULTIPLIER[timeframe] ?? 1,
  );
};

const buildHistoricalWindowBySeconds = (
  entryTime: number,
  exitTime: number | null,
  intervalSeconds: number,
  windowMultiplier = 1,
) => {
  const beforeBars = Math.max(
    20,
    Math.round((exitTime ? 160 : 120) * windowMultiplier),
  );
  const afterBars = Math.max(
    20,
    Math.round((exitTime ? 120 : 90) * windowMultiplier),
  );

  return {
    windowStart: Math.max(0, entryTime - beforeBars * intervalSeconds * 1000),
    windowEnd: Math.max(
      entryTime + intervalSeconds * 1000 * 20,
      (exitTime ?? entryTime) + afterBars * intervalSeconds * 1000,
    ),
    limit: Math.min(1000, beforeBars + afterBars + 40),
  };
};

export const fetchBinanceCandles = async ({
  symbol,
  interval,
  startTime,
  endTime,
  limit,
  signal,
}: {
  symbol: string;
  interval: BinanceInterval;
  startTime: number;
  endTime: number;
  limit: number;
  signal?: AbortSignal;
}): Promise<HistoricalCandle[]> => {
  const proxyUrl = new URL(BINANCE_PROXY_URL);
  proxyUrl.searchParams.set("symbol", symbol);
  proxyUrl.searchParams.set("interval", interval);
  proxyUrl.searchParams.set("startTime", String(startTime));
  proxyUrl.searchParams.set("endTime", String(endTime));
  proxyUrl.searchParams.set("limit", String(limit));

  const response = await fetch(proxyUrl.toString(), {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      details || `Binance candle request failed with status ${response.status}`,
    );
  }

  const payload = (await response.json()) as
    | Array<
        [
          number,
          string,
          string,
          string,
          string,
          string,
          number,
          string,
          number,
          string,
          string,
          string,
        ]
      >
    | {
        candles?: Array<
          [
            number,
            string,
            string,
            string,
            string,
            string,
            number,
            string,
            number,
            string,
            string,
            string,
          ]
        >;
      };

  const rows = Array.isArray(payload) ? payload : (payload.candles ?? []);

  return rows
    .map((row) => ({
      time: Math.floor(Number(row[0]) / 1000),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    }))
    .filter(
      (candle) => Number.isFinite(candle.time) && Number.isFinite(candle.open),
    );
};

export const fetchYahooCandles = async ({
  symbol,
  interval,
  startTime,
  endTime,
  signal,
}: {
  symbol: string;
  interval: string;
  startTime: number;
  endTime: number;
  signal?: AbortSignal;
}): Promise<HistoricalCandle[]> => {
  const proxyUrl = new URL(YAHOO_PROXY_URL);
  proxyUrl.searchParams.set("symbol", symbol);
  proxyUrl.searchParams.set("interval", interval);
  proxyUrl.searchParams.set("period1", String(Math.floor(startTime / 1000)));
  proxyUrl.searchParams.set("period2", String(Math.floor(endTime / 1000)));

  const response = await fetch(proxyUrl.toString(), {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      details || `Yahoo candle request failed with status ${response.status}`,
    );
  }

  const payload = (await response.json()) as {
    candles?: Array<{
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
  };

  return (payload.candles ?? []).filter(
    (candle) => Number.isFinite(candle.time) && Number.isFinite(candle.open),
  );
};

export const fetchHistoricalCandlesForTrade = async (
  trade: TradeLike,
  options: { signal?: AbortSignal; timeframe?: TradeReplayTimeframe } = {},
): Promise<HistoricalCandleResult> => {
  const entryTime = getTradeEntryTimestamp(trade);
  const exitTime = getTradeExitTimestamp(trade);
  const provider = resolveMarketProvider(trade);

  if (!provider) {
    return {
      provider: "yahoo",
      symbol: null,
      interval: null,
      entryTime,
      exitTime,
      windowStart: null,
      windowEnd: null,
      candles: [],
      reason:
        "This market type is not mapped to a free historical provider yet.",
    };
  }

  if (!entryTime) {
    return {
      provider,
      symbol: null,
      interval: null,
      entryTime: null,
      exitTime,
      windowStart: null,
      windowEnd: null,
      candles: [],
      reason: "Trade entry time is required to load historical candles.",
    };
  }

  if (provider === "binance") {
    const symbol = normalizeBinanceSymbol(trade);

    if (!symbol) {
      return {
        provider,
        symbol: null,
        interval: null,
        entryTime,
        exitTime,
        windowStart: null,
        windowEnd: null,
        candles: [],
        reason: "Historical replay is unavailable for this crypto symbol.",
      };
    }

    const interval = resolveBinanceInterval(entryTime, exitTime);
    const { windowStart, windowEnd, limit } = buildHistoricalWindow(
      entryTime,
      exitTime,
      interval,
      options.timeframe,
    );

    const candles = await fetchBinanceCandles({
      symbol,
      interval,
      startTime: windowStart,
      endTime: windowEnd,
      limit,
      signal: options.signal,
    });

    return {
      provider,
      symbol,
      interval,
      entryTime,
      exitTime,
      windowStart,
      windowEnd,
      candles,
    };
  }

  const yahooSymbol = normalizeYahooSymbol(trade);

  if (!yahooSymbol) {
    return {
      provider,
      symbol: null,
      interval: null,
      entryTime,
      exitTime,
      windowStart: null,
      windowEnd: null,
      candles: [],
      reason: "Historical replay is unavailable for this symbol.",
    };
  }

  const interval = resolveYahooInterval(trade, entryTime, exitTime);
  const { windowStart, windowEnd } = buildHistoricalWindowBySeconds(
    entryTime,
    exitTime,
    YAHOO_INTERVAL_SECONDS[interval] ?? 3600,
    REPLAY_TIMEFRAME_MULTIPLIER[options.timeframe ?? "1M"] ?? 1,
  );

  const candles = await fetchYahooCandles({
    symbol: yahooSymbol,
    interval,
    startTime: windowStart,
    endTime: windowEnd,
    signal: options.signal,
  });

  return {
    provider: "yahoo",
    symbol: yahooSymbol,
    interval,
    entryTime,
    exitTime,
    windowStart,
    windowEnd,
    candles,
  };
};
