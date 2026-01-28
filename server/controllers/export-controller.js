const Trade = require("../models/trade-model");

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
          dateTime: t.dateTime,
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
          rr: t.rr,
          pnl: t.pnl,
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
        "Date",
        "Market",
        "Symbol",
        "Direction",
        "Entry",
        "Stoploss",
        "TakeProfit",
        "ExitPrice",
        "ExitVolume",
        "RR",
        "PNL",
        "Risk",
        "Result",
        "Notes",
      ];

      const rows = [];

      trades.forEach((t) => {
        t.exitedPrice.forEach((exit) => {
          rows.push(
            [
              t.dateTime,
              t.marketType,
              t.symbol,
              t.tradeDirection,
              t.entryPrice,
              t.stoplossPrice,
              t.takeProfitPrice,
              exit.price,
              exit.volume,
              t.rr,
              t.pnl,
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
