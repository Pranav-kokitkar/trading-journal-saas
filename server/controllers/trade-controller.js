const mongoose = require("mongoose");
const Trade = require("../models/trade-model");
const cloudinary = require("../config/cloudinary");

const AddTrade = async (req, res) => {
  try {
    const userId = req.userID || (req.user && req.user._id);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

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
      accountId,
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

    if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: "Valid accountId is required" });
    }

    /* ---------------- PARSE exitedPrice ---------------- */
    let parsedExitedPrice = exitedPrice;
    if (typeof parsedExitedPrice === "string") {
      try {
        parsedExitedPrice = JSON.parse(parsedExitedPrice);
      } catch {
        parsedExitedPrice = [];
      }
    }

    /* ---------------- FILE HANDLING ---------------- */
    const files = Array.isArray(req.files) ? req.files : [];

    // ✅ PLAN-BASED LIMIT (BACKEND ENFORCEMENT)
    const isPro =
      req.user?.plan === "pro" &&
      req.user?.planExpiresAt &&
      new Date(req.user.planExpiresAt) > new Date();

    const uploadLimit = isPro ? 3 : 1;

    if (files.length > uploadLimit) {
      return res.status(400).json({
        message: `You can upload a maximum of ${uploadLimit} screenshots`,
      });
    }

    const screenshotUrls = [];

    for (const file of files) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "trading-journal/trades" },
            (error, uploadResult) => {
              if (error) return reject(error);
              resolve(uploadResult);
            }
          );

          uploadStream.end(file.buffer);
        });

        if (result?.secure_url) {
          screenshotUrls.push(result.secure_url);
        }
      } catch (err) {
        console.error("Cloudinary upload error:", err);
      }
    }

    /* ---------------- SAVE TRADE ---------------- */
    const tradeToSave = {
      userId,
      accountId: new mongoose.Types.ObjectId(accountId),
      marketType,
      symbol,
      tradeDirection,
      entryPrice: Number(entryPrice),
      stoplossPrice: Number(stoplossPrice),
      takeProfitPrice:
        takeProfitPrice == null ? undefined : Number(takeProfitPrice),

      exitedPrice: Array.isArray(parsedExitedPrice)
        ? parsedExitedPrice.map((e) => ({
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

      screenshots: screenshotUrls,

      dateTime: dateTime ? new Date(dateTime) : new Date(),
      tradeNotes: tradeNotes || "",
      tradeStatus: (tradeStatus || "").toString().trim(),
    };

    const savedTrade = await Trade.create(tradeToSave);

    return res.status(201).json({ success: true, trade: savedTrade });
  } catch (error) {
    console.error("AddTrade error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllTrades = async (req, res) => {
  try {
    const userId = req.userID || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      page = 1,
      limit = 8,

      symbol,
      marketType,
      status,
      result,
      direction,

      pnlOperator,
      pnlValue,

      rrOperator,
      rrValue,

      startDate,
      endDate,

      startTradeNumber,
      endTradeNumber,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    /** ---------------- BUILD QUERY ---------------- */
    const query = { userId };

    if (symbol) {
      query.symbol = { $regex: symbol, $options: "i" };
    }

    if (marketType) query.marketType = marketType;
    if (status) query.tradeStatus = status;
    if (result) query.tradeResult = result;
    if (direction) query.tradeDirection = direction;

    if (pnlValue) {
      query.pnl = {
        [pnlOperator === ">" ? "$gt" : pnlOperator === "<" ? "$lt" : "$eq"]:
          Number(pnlValue),
      };
    }

    if (rrValue) {
      query.rr = {
        [rrOperator === ">" ? "$gt" : rrOperator === "<" ? "$lt" : "$eq"]:
          Number(rrValue),
      };
    }

    if (startDate || endDate) {
      query.dateTime = {};
      if (startDate) query.dateTime.$gte = new Date(startDate);
      if (endDate) query.dateTime.$lte = new Date(endDate);
    }

    if (startTradeNumber || endTradeNumber) {
      query.tradeNumber = {};
      if (startTradeNumber) query.tradeNumber.$gte = Number(startTradeNumber);
      if (endTradeNumber) query.tradeNumber.$lte = Number(endTradeNumber);
    }

    /** ---------------- QUERY DB ---------------- */
    const [trades, totalTrades] = await Promise.all([
      Trade.find(query)
        .sort({ dateTime: -1 }) // NEWEST FIRST
        .skip(skip)
        .limit(Number(limit)),

      Trade.countDocuments(query),
    ]);

    res.status(200).json({
      trades,
      stats: { filteredTrades: totalTrades },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalTrades / limit),
      },
    });
  } catch (err) {
    console.error("getAllTrades error:", err);
    res.status(500).json({ message: "Server error" });
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

    const { exitedPrice, pnl, rr, tradeResult, balanceAfterTrade } = req.body;

    if (!Array.isArray(exitedPrice) || exitedPrice.length === 0) {
      return res
        .status(400)
        .json({ message: "exitedPrice must be a non-empty array" });
    }

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

    const totalVolume = exitedPrice.reduce(
      (s, l) => s + Number(l.volume || 0),
      0
    );
    if (Math.abs(totalVolume - 100) > 0.01 && totalVolume !== 0) {
      return res.status(400).json({
        message:
          "Sum of exit volumes should equal 100 if volumes are percentages.",
      });
    }

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

    const trade = await Trade.findById(tradeId).lean();
    if (!trade) return res.status(404).json({ message: "Trade not found" });

    if (String(trade.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Not allowed to close this trade" });
    }

    const rawStatus = (trade.tradeStatus || trade.status || "")
      .toString()
      .toLowerCase()
      .trim();
    if (rawStatus !== "live") {
      return res.status(409).json({
        message: `Trade is not live (current status: ${trade.tradeStatus})`,
      });
    }

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

const updateTradeNotesById = async (req, res) => {
  try {
    const id = req.params.id;
    const tardeNotes = req.body;
    const response = await Trade.updateOne({ _id: id }, { $set: tardeNotes });
    res.status(200).json({ message: "update success" });
  } catch (error) {
    res.status(400).json({ message: "failed to update notes" });
  }
};

module.exports = {
  AddTrade,
  getAllTrades,
  getTradeByID,
  closeTradeByID,
  deleteTradeById,
  updateTradeNotesById,
};
