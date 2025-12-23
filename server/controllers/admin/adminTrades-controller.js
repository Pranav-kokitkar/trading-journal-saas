const Trades = require("../../models/trade-model");
const User = require("../../models/user-model");
const Account = require("../../models/account-model");
const mongoose = require("mongoose");

const getAllTrades = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const tradeStatus = req.query.tradeStatus || "all"; // live, exited, all
    const tradeResult = req.query.tradeResult || "all"; // win, loss, breakeven, all
    const accountId = req.query.accountId || ""; // filter by specific account
    const dateFrom = req.query.dateFrom || ""; // filter by date range
    const dateTo = req.query.dateTo || "";

    let filter = {};

    // --- SEARCH FILTER ---
    // Search by user email/name, account name, or symbol
    if (search) {
      // Find matching users
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const userIds = users.map((user) => user._id);

      // Find matching accounts
      const accounts = await Account.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const accountIds = accounts.map((account) => account._id);

      // Combine: search by symbol, user, or account
      filter.$or = [
        { symbol: { $regex: search, $options: "i" } },
        { userId: { $in: userIds } },
        { accountId: { $in: accountIds } },
      ];
    }

    // --- STATUS FILTERS ---
    if (tradeStatus !== "all") {
      filter.tradeStatus = tradeStatus;
    }

    if (tradeResult !== "all") {
      filter.tradeResult = tradeResult;
    }

    // --- SPECIFIC ACCOUNT FILTER ---
    if (accountId) {
      filter.accountId = accountId;
    }

    // --- DATE RANGE FILTER ---
    if (dateFrom || dateTo) {
      filter.dateTime = {};
      if (dateFrom) {
        filter.dateTime.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Set to end of day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.dateTime.$lte = endDate;
      }
    }

    // --- FETCH TRADES ---
    const trades = await Trades.find(filter)
      .sort({ dateTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "email name username")
      .populate("accountId", "name status");

    // --- GET STATS WITH FILTER APPLIED ---
    const totalTrades = await Trades.countDocuments(filter);
    const totalLiveTrades = await Trades.countDocuments({
      ...filter,
      tradeStatus: "live",
    });
    const totalExitedTrades = await Trades.countDocuments({
      ...filter,
      tradeStatus: "exited",
    });

    // Additional stats
    const totalWins = await Trades.countDocuments({
      ...filter,
      tradeResult: "win",
    });
    const totalLosses = await Trades.countDocuments({
      ...filter,
      tradeResult: "loss",
    });
    const totalBreakeven = await Trades.countDocuments({
      ...filter,
      tradeResult: "breakeven",
    });

    // Calculate total PnL
    const pnlResult = await Trades.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPnL: { $sum: "$pnl" },
          avgRR: { $avg: "$rr" },
        },
      },
    ]);

    const stats = {
      totalTrades,
      totalLiveTrades,
      totalExitedTrades,
      totalWins,
      totalLosses,
      totalBreakeven,
      totalPnL: pnlResult[0]?.totalPnL || 0,
      avgRR: pnlResult[0]?.avgRR || 0,
      winRate:
        totalWins + totalLosses > 0
          ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(2)
          : 0,
    };

    res.status(200).json({
      trades,
      stats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTrades / limit),
        limit,
      },
      filters: {
        search: search || null,
        tradeStatus,
        tradeResult,
        accountId: accountId || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      },
    });
  } catch (error) {
    console.error("Error fetching trades:", error);
    res.status(500).json({
      message: "error from backend while getting all trades for admin",
      error: error.message,
    });
  }
};

const getTradeByID = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid trade ID" });
    }

    const response = await Trades.findById(id)
      .populate("userId", "email name")
      .populate("accountId", "name status");
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: "error from server while geeting tarde by id",
      error: error.message,
    });
  }
};

module.exports = { getAllTrades, getTradeByID };
