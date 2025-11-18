const Trade = require("../models/trade-model");

const AddTrade = async (req, res, next) => {
  try {
    // authMiddleware should have set req.userID (and req.user)
    const userId = req.userID || (req.user && req.user._id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      marketType,
      symbol,
      tradeDirection,
      entryPrice,
      stoplossPrice,
      takeProfitPrice,
      exitedPrice,
      rr,
      pnl,
      tradeResult,
      riskAmount,
      riskPercent,
      balanceAfterTrade,
      tradeNumber,
      dateTime,
      tradeNotes,
    } = req.body;

    // Basic required-field check (expand if needed)
    if (
      !marketType ||
      !symbol ||
      !tradeDirection ||
      entryPrice == null ||
      stoplossPrice == null
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const tradeToSave = {
      userId,
      marketType,
      symbol,
      tradeDirection,
      entryPrice: Number(entryPrice),
      stoplossPrice: Number(stoplossPrice),
      takeProfitPrice:
        takeProfitPrice == null ? undefined : Number(takeProfitPrice),
      exitedPrice: Array.isArray(exitedPrice)
        ? exitedPrice.map((e) => ({
            price: Number(e.price),
            volume: Number(e.volume),
          }))
        : [],
      rr: rr == null ? 0 : Number(rr),
      pnl: pnl == null ? 0 : Number(pnl),
      tradeResult: tradeResult || "",
      riskAmount: riskAmount == null ? 0 : Number(riskAmount),
      riskPercent: riskPercent == null ? 0 : Number(riskPercent),
      balanceAfterTrade:
        balanceAfterTrade == null ? 0 : Number(balanceAfterTrade),
      tradeNumber: tradeNumber == null ? 0 : Number(tradeNumber),
      dateTime: dateTime ? new Date(dateTime) : new Date(),
      tradeNotes: tradeNotes || "",
    };

    const savedTrade = await Trade.create(tradeToSave);

    return res.status(201).json({ success: true, trade: savedTrade });
  } catch (error) {
    console.error("AddTrade error", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { AddTrade };
