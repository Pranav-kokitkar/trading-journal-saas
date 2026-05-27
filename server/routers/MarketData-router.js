const express = require("express");

const router = express.Router();

const BINANCE_BASE_URL = "https://api.binance.com/api/v3";
const YAHOO_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

const isFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric);
};

router.get("/binance/klines", async (req, res, next) => {
  try {
    const { symbol, interval, startTime, endTime, limit } = req.query;

    if (!symbol || !interval) {
      return res.status(400).json({
        message: "symbol and interval are required",
      });
    }

    if (!isFiniteNumber(startTime) || !isFiniteNumber(endTime)) {
      return res.status(400).json({
        message: "startTime and endTime must be valid timestamps",
      });
    }

    const query = new URLSearchParams({
      symbol: String(symbol).toUpperCase(),
      interval: String(interval),
      startTime: String(Math.max(0, Number(startTime))),
      endTime: String(Math.max(0, Number(endTime))),
      limit: String(
        Number.isFinite(Number(limit))
          ? Math.min(1000, Math.max(1, Number(limit)))
          : 500,
      ),
    });

    const response = await fetch(
      `${BINANCE_BASE_URL}/klines?${query.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      return res.status(response.status).json({
        message: details || "Failed to fetch Binance candles",
      });
    }

    const candles = await response.json();
    return res.json({ candles });
  } catch (error) {
    return next(error);
  }
});

router.get("/yahoo/chart", async (req, res, next) => {
  try {
    const { symbol, interval, period1, period2 } = req.query;

    if (!symbol || !interval) {
      return res.status(400).json({
        message: "symbol and interval are required",
      });
    }

    if (!isFiniteNumber(period1) || !isFiniteNumber(period2)) {
      return res.status(400).json({
        message: "period1 and period2 must be valid timestamps",
      });
    }

    const query = new URLSearchParams({
      period1: String(Math.max(0, Number(period1))),
      period2: String(Math.max(0, Number(period2))),
      interval: String(interval),
      includePrePost: "false",
      events: "div,splits",
    });

    const response = await fetch(
      `${YAHOO_BASE_URL}/${encodeURIComponent(String(symbol))}?${query.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      },
    );

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      return res.status(response.status).json({
        message: details || "Failed to fetch Yahoo candles",
      });
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];
    const timestamps = result?.timestamp || [];

    const candles = timestamps
      .map((timestamp, index) => ({
        time: Number(timestamp),
        open: Number(quote?.open?.[index]),
        high: Number(quote?.high?.[index]),
        low: Number(quote?.low?.[index]),
        close: Number(quote?.close?.[index]),
        volume: Number(quote?.volume?.[index] ?? 0),
      }))
      .filter(
        (candle) =>
          Number.isFinite(candle.time) &&
          Number.isFinite(candle.open) &&
          Number.isFinite(candle.high) &&
          Number.isFinite(candle.low) &&
          Number.isFinite(candle.close),
      );

    return res.json({ candles });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
