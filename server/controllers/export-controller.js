const Trade = require("../models/trade-model");

const toIsoString = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
};

const exportTrades = async (req, res) => {
  try {
    const { format } = req.query; // csv | json
    const userId = req.userID;

    // ✅ PERFORMANCE: Only select needed fields, use lean()
    const trades = await Trade.find({ userId })
      .select("-__v -userId") // Exclude unnecessary fields
      .sort({ dateTime: 1 })
      .lean();

    if (!trades.length) {
      return res.status(404).json({ message: "No trades found" });
    }

    // ---------- JSON EXPORT ----------
    if (format === "json") {
      const exportData = {
        exportedAt: new Date().toISOString(),
        tradeCount: trades.length,
        trades: trades.map((t) => ({
          dateTime: toIsoString(t.dateTime),
          entryTime: toIsoString(t.entryTime),
          exitTime: toIsoString(t.exitTime),
          marketType: t.marketType,
          symbol: t.symbol,
          direction: t.tradeDirection,
          entryPrice: t.entryPrice,
          stoplossPrice: t.stoplossPrice,
          takeProfitPrice: t.takeProfitPrice,
          exits: t.exitedPrice.map((e) => ({
            price: e.price,
            volume: e.volume,
          })),
          exitTimestamps: Array.isArray(t.exitTimestamps)
            ? t.exitTimestamps.map((e) => ({
                price: e.price,
                volume: e.volume,
                timestamp: toIsoString(e.timestamp),
              }))
            : [],
          rr: t.rr,
          pnl: t.pnl,
          durationMinutes: t.durationMinutes,
          durationHours: t.durationHours,
          durationText: t.durationText,
          riskAmount: t.riskAmount,
          result: t.tradeResult,
          notes: t.tradeNotes,
          screenshots: t.screenshots,
        })),
      };

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=trading-journal.json",
      );
      return res.json(exportData);
    }

    // ---------- CSV EXPORT (EXIT-BASED) ----------
    if (format === "csv") {
      const headers = [
        "EntryTime",
        "ExitTime",
        "Market",
        "Symbol",
        "Direction",
        "Entry",
        "Stoploss",
        "TakeProfit",
        "ExitPrice",
        "ExitVolume",
        "ExitTimestamp",
        "RR",
        "PNL",
        "DurationMinutes",
        "DurationHours",
        "Duration",
        "Risk",
        "Result",
        "Notes",
      ];

      const rows = [];

      trades.forEach((t) => {
        const exitTimestamps = Array.isArray(t.exitTimestamps)
          ? t.exitTimestamps
          : [];
        t.exitedPrice.forEach((exit, index) => {
          const exitTimestamp =
            exitTimestamps[index]?.timestamp || t.exitTime || "";
          rows.push(
            [
              toIsoString(t.entryTime || t.dateTime),
              toIsoString(t.exitTime),
              t.marketType,
              t.symbol,
              t.tradeDirection,
              t.entryPrice,
              t.stoplossPrice,
              t.takeProfitPrice,
              exit.price,
              exit.volume,
              toIsoString(exitTimestamp),
              t.rr,
              t.pnl,
              t.durationMinutes ?? "",
              t.durationHours ?? "",
              t.durationText ?? "",
              t.riskAmount,
              t.tradeResult,
              `"${(t.tradeNotes || "").replace(/"/g, '""')}"`,
            ].join(","),
          );
        });
      });

      const csv = [headers.join(","), ...rows].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=trading-journal.csv",
      );

      return res.send(csv);
    }

    return res.status(400).json({ message: "Invalid format" });
  } catch (error) {
    res.status(500).json({ message: "Export failed", error });
  }
};

module.exports = { exportTrades };
