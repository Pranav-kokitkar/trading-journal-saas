const Trade = require("../models/trade-model");
const mongoose = require("mongoose");

const toIsoString = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
};

const exportTrades = async (req, res) => {
  try {
    const { format, accountId } = req.query; // csv | json
    const userId = req.userID;

    if (accountId && !mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: "Invalid accountId" });
    }

    const tradeFilter = {
      userId,
      deleted: { $ne: true },
    };

    if (accountId) {
      tradeFilter.accountId = accountId;
    }

    // ✅ PERFORMANCE: Only select needed fields, use lean()
    // ✅ CRITICAL FIX: Exclude soft-deleted trades
    const trades = await Trade.find(tradeFilter)
      .select("-__v -userId") // Exclude unnecessary fields
      .populate({ path: "tags", select: "name colour" })
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
          riskAmount: t.riskAmount,
          result: t.tradeResult,
          notes: t.tradeNotes,
          session: t.session,
          tags: Array.isArray(t.tags)
            ? t.tags.map((tag) => ({
                id: tag?._id,
                name: tag?.name || "",
                colour: tag?.colour || "",
              }))
            : [],
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
        "Risk",
        "Result",
        "Session",
        "Tags",
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
          const tagNames = Array.isArray(t.tags)
            ? t.tags
                .map((tag) => tag?.name || "")
                .filter(Boolean)
                .join("; ")
            : "";
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
              t.riskAmount,
              t.tradeResult,
              t.session || "",
              `"${tagNames.replace(/"/g, '""')}"`,
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
