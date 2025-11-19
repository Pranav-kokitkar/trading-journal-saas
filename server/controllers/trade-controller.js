const mongoose = require("mongoose");
const Trade = require("../models/trade-model");

const AddTrade = async (req, res, next) => {
  try {
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
      tradeStatus,
    } = req.body;

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
      tradeStatus: (tradeStatus || "").toString().trim(), // <-- include it
    };

    const savedTrade = await Trade.create(tradeToSave);

    return res.status(201).json({ success: true, trade: savedTrade });
  } catch (error) {
    console.error("AddTrade error", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllTrades = async (req, res, next) => {
  try {
    const userId = req.userID || (req.user && req.user._id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const response = await Trade.find({ userId }).sort({ date: -1 });
    if (!response) {
      return res.status(401).json({ message: "no trades found" });
    }
    res.status(200).json({ response });
  } catch (error) {
    console.log("get all tardes error", error);
    return res.status(400).json({ success: false, message: "server error" });
  }
};

const getTradeByID = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await Trade.findOne({ _id: id });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error });
  }
};

const closeTradeByID = async (req, res, next) => {
  try {
    // DEBUG: helps identify why Postman returned {"message":{}}
    console.log("CLOSE TRADE called:", {
      params: req.params,
      body: req.body,
      user: req.user,
    });

    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const tradeId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(tradeId)) {
      return res.status(400).json({ message: "Invalid trade id" });
    }

    // Expect body to include final fields from frontend
    const {
      exitedPrice,
      pnl,
      rr,
      tradeResult,
      balanceAfterTrade,
      // note: no exitReason expected per your schema
    } = req.body;

    if (!Array.isArray(exitedPrice) || exitedPrice.length === 0) {
      return res
        .status(400)
        .json({ message: "exitedPrice must be a non-empty array" });
    }

    // Validate each exit level
    for (const lvl of exitedPrice) {
      if (typeof lvl !== "object") {
        return res.status(400).json({
          message: "Each exit level must be an object with price and volume",
        });
      }
      const p = Number(lvl.price);
      const v = Number(lvl.volume);
      if (!isFinite(p) || p <= 0 || !isFinite(v) || v < 0) {
        return res.status(400).json({
          message: "Exit levels must have valid numeric price and volume",
        });
      }
    }

    // Optional percent-volume check (only if you store percentages)
    const totalVolume = exitedPrice.reduce(
      (s, l) => s + Number(l.volume || 0),
      0
    );
    if (Math.abs(totalVolume - 100) > 0.01 && totalVolume !== 0) {
      // allow totalVolume===0 if you use absolute volumes instead of percent
      return res.status(400).json({
        message:
          "Sum of exit volumes should equal 100 if volumes are percentages.",
      });
    }

    // Validate numeric fields if provided
    if (pnl !== undefined && !isFinite(Number(pnl))) {
      return res.status(400).json({ message: "pnl must be a valid number" });
    }
    if (rr !== undefined && !isFinite(Number(rr))) {
      return res.status(400).json({ message: "rr must be a valid number" });
    }
    if (
      balanceAfterTrade !== undefined &&
      !isFinite(Number(balanceAfterTrade))
    ) {
      return res
        .status(400)
        .json({ message: "balanceAfterTrade must be a valid number" });
    }

    // Ensure trade exists and belongs to user
    const trade = await Trade.findById(tradeId).lean();
    if (!trade) return res.status(404).json({ message: "Trade not found" });

    if (String(trade.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Not allowed to close this trade" });
    }

    // Only allow close if current tradeStatus is "live"
    const rawStatus = (trade.tradeStatus || trade.status || "")
      .toString()
      .toLowerCase()
      .trim();
    if (rawStatus !== "live") {
      return res.status(409).json({
        message: `Trade is not live (current status: ${trade.tradeStatus})`,
      });
    }

    // Prepare update object
    const update = {
      exitedPrice: exitedPrice.map((lvl) => ({
        price: Number(lvl.price),
        volume: Number(lvl.volume),
      })),
      pnl: pnl !== undefined ? Number(pnl) : trade.pnl ?? 0,
      rr: rr !== undefined ? Number(rr) : trade.rr ?? 0,
      tradeResult: tradeResult || trade.tradeResult || "breakeven",
      balanceAfterTrade:
        balanceAfterTrade !== undefined
          ? Number(balanceAfterTrade)
          : trade.balanceAfterTrade ?? null,
      tradeStatus: "closed",
      closedBy: userId,
      exitTime: new Date().toISOString(),
    };

    // Atomic conditional update: only update if status still live and owner matches
    const filter = { _id: tradeId, userId: userId, tradeStatus: "live" };
    const opts = { new: true, returnDocument: "after" };
    const updated = await Trade.findOneAndUpdate(filter, update, opts).lean();

    if (!updated) {
      return res.status(409).json({
        message: "Trade was already closed or modified by another action",
      });
    }

    return res.status(200).json({ success: true, trade: updated });
  } catch (err) {
    console.error("closeTrade error:", err);
    return res.status(500).json({
      message:
        err?.message || String(err) || "Server error while closing trade",
    });
  }
};

const deleteTradeById = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Trade.deleteOne({ _id: id });
    res.status(200).json({ message: "tarde deleted" });
  } catch (error) {
    return res.status(400).json({ message: error });
  }
};

module.exports = {
  AddTrade,
  getAllTrades,
  getTradeByID,
  closeTradeByID,
  deleteTradeById,
};
