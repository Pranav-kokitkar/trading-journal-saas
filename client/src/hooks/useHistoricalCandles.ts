import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchHistoricalCandlesForTrade,
  type HistoricalCandle,
  type HistoricalCandleResult,
  type TradeLike,
  type TradeReplayTimeframe,
} from "../utils/binanceDatafeed";

interface UseHistoricalCandlesState {
  candles: HistoricalCandle[];
  loading: boolean;
  error: string | null;
  metadata: HistoricalCandleResult | null;
}

const historicalCandlesCache = new Map<string, HistoricalCandleResult>();

const buildCacheKey = (trade: TradeLike | null | undefined) => {
  if (!trade) return "no-trade";

  return [
    trade._id ?? trade.id ?? trade.tradeNumber ?? "unknown",
    trade.symbol ?? "",
    trade.marketType ?? "",
    trade.entryTime ??
      trade.dateTime ??
      trade.dateNtime ??
      trade.tradeDate ??
      "",
    trade.exitTime ?? "",
  ].join("|");
};

export const useHistoricalCandles = (
  trade: TradeLike | null | undefined,
  enabled = true,
  timeframe: TradeReplayTimeframe = "1M",
) => {
  const cacheKey = useMemo(
    () => `${buildCacheKey(trade)}|${timeframe}`,
    [timeframe, trade],
  );
  const requestIdRef = useRef(0);

  const [state, setState] = useState<UseHistoricalCandlesState>({
    candles: [],
    loading: Boolean(trade && enabled),
    error: null,
    metadata: null,
  });

  useEffect(() => {
    if (!trade || !enabled) {
      setState({ candles: [], loading: false, error: null, metadata: null });
      return;
    }

    const cached = historicalCandlesCache.get(cacheKey);
    if (cached) {
      setState({
        candles: cached.candles,
        loading: false,
        error: cached.reason ?? null,
        metadata: cached,
      });
      return;
    }

    const requestId = ++requestIdRef.current;
    const abortController = new AbortController();

    setState((previous) => ({ ...previous, loading: true, error: null }));

    fetchHistoricalCandlesForTrade(trade, {
      signal: abortController.signal,
      timeframe,
    })
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        historicalCandlesCache.set(cacheKey, result);
        setState({
          candles: result.candles,
          loading: false,
          error: result.reason ?? null,
          metadata: result,
        });
      })
      .catch((error) => {
        if (
          requestId !== requestIdRef.current ||
          abortController.signal.aborted
        ) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load historical candles.";
        setState({
          candles: [],
          loading: false,
          error: message,
          metadata: null,
        });
      });

    return () => {
      abortController.abort();
    };
  }, [cacheKey, enabled, timeframe, trade]);

  return state;
};
