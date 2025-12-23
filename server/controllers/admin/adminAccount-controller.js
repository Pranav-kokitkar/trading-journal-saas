const mongoose = require("mongoose");
const Account = require("../../models/account-model");
const Trade = require("../../models/trade-model");
const User = require("../../models/user-model");

const getAllAccounts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "all"; // Add status filter

    let filter = {};

    // Status filter
    if (status === "active") {
      filter.status = "active";
    } else if (status === "archived") {
      filter.status = "archived";
    } else if (status === "disabled") {
      filter.status = "disabled";
    }
    // if status === 'all', don't add filter

    // If search exists, we need to find matching users first
    let userIds = [];
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      userIds = users.map((user) => user._id);

      // Combine: search by account name OR by user
      filter.$or = [
        { name: { $regex: search, $options: "i" } }, // Account name
        { userId: { $in: userIds } }, // User's email/username/name
      ];
    }

    // Get accounts with filter and populate user data
    const accounts = await Account.find(filter)
      .populate("userId", "name email username") // Populate user fields
      .sort({ createdAt: -1 }) // Changed from submittedAt to createdAt
      .skip(skip)
      .limit(limit);

    // Get counts with filter applied
    const totalAccounts = await Account.countDocuments(filter);
    const activeAccounts = await Account.countDocuments({
      ...filter,
      status: "active",
    });
    const archivedAccounts = await Account.countDocuments({
      ...filter,
      status: "archived",
    });
    const disabledAccounts = await Account.countDocuments({
      ...filter,
      status: "disabled",
    });

    res.status(200).json({
      accounts,
      stats: {
        totalAccounts,
        activeAccounts,
        archivedAccounts,
        disabledAccounts,
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalAccounts / limit),
        limit,
      },
      filters: {
        search: search || null,
        status,
      },
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({
      message: "Server error while getting accounts",
      error: error.message,
    });
  }
};

const getAccountByID = async (req, res) => {
  try {
    const { id } = req.params;

    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }

    const accountDetails = await Account.findById(id);

    if (!accountDetails) {
      return res.status(404).json({ message: "Account does not exist" });
    }

    res.status(200).json(accountDetails);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get account",
      error: error.message,
    });
  }
};

const editAccountDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }

    const { name, status } = req.body;

    // build update object manually (WHITELIST)
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ message: "Invalid account name" });
      }
      updateData.name = name.trim();
    }

    if (status !== undefined) {
      const allowedStatus = ["active", "archived", "disabled"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Invalid account status" });
      }
      updateData.status = status;
    }

    // no valid fields provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    const updatedAccount = await Account.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json(updatedAccount);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update account details",
      error: error.message,
    });
  }
};

const getTradesByAccountId = async (req, res) => {
  try {
    const accountId = req.params.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: "Invalid Account Id" });
    }

    const Trades = await Trade.find({ accountId })
      .sort({ dateTime: -1 })
      .skip(skip)
      .limit(limit);
    const Totaltrades = await Trade.countDocuments({ accountId });

    res.status(200).json({
      Trades,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(Totaltrades / limit),
      },
    });
  } catch (err) {
    res.status(400).json({
      message: "error from backend whil getting tardes by account id",
      error: err.message,
    });
  }
};

const getAccountPerformance = async (req, res) => {
  try {
    const { id: accountId } = req.params;

    if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }

    const accountObjectId = new mongoose.Types.ObjectId(accountId);

    /** ---------------- SUMMARY STATS ---------------- */
    const summaryResult = await Trade.aggregate([
      {
        $match: {
          accountId: accountObjectId,
        },
      },
      {
        $group: {
          _id: null,

          totalTrades: { $sum: 1 },

          totalLongTrades: {
            $sum: {
              $cond: [{ $eq: ["$tradeDirection", "long"] }, 1, 0],
            },
          },
          totalShortTrades: {
            $sum: {
              $cond: [{ $eq: ["$tradeDirection", "short"] }, 1, 0],
            },
          },

          totalLiveTrades: {
            $sum: {
              $cond: [{ $eq: ["$tradeStatus", "live"] }, 1, 0],
            },
          },
          totalExitedTrades: {
            $sum: {
              $cond: [{ $eq: ["$tradeStatus", "exited"] }, 1, 0],
            },
          },

          winningTrades: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$tradeStatus", "exited"] },
                    { $eq: ["$tradeResult", "win"] },
                  ],
                },
                1,
                0,
              ],
            },
          },

          losingTrades: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$tradeStatus", "exited"] },
                    { $eq: ["$tradeResult", "loss"] },
                  ],
                },
                1,
                0,
              ],
            },
          },

          totalPnL: {
            $sum: {
              $cond: [{ $eq: ["$tradeStatus", "exited"] }, "$pnl", 0],
            },
          },

          totalRR: {
            $sum: {
              $cond: [{ $eq: ["$tradeStatus", "exited"] }, "$rr", 0],
            },
          },

          totalRiskAmount: {
            $sum: {
              $cond: [{ $eq: ["$tradeStatus", "exited"] }, "$riskAmount", 0],
            },
          },

          totalProfit: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$tradeStatus", "exited"] },
                    { $gt: ["$pnl", 0] },
                  ],
                },
                "$pnl",
                0,
              ],
            },
          },

          totalLoss: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$tradeStatus", "exited"] },
                    { $lt: ["$pnl", 0] },
                  ],
                },
                "$pnl",
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats = summaryResult[0] || {};

    const {
      totalTrades = 0,
      totalLiveTrades = 0,
      totalExitedTrades = 0,
      totalLongTrades = 0,
      totalShortTrades = 0,
      winningTrades = 0,
      losingTrades = 0,
      totalPnL = 0,
      totalRR = 0,
      totalRiskAmount = 0,
      totalProfit = 0,
      totalLoss = 0,
    } = stats;

    const winRate =
      totalExitedTrades > 0
        ? Number(((winningTrades / totalExitedTrades) * 100).toFixed(2))
        : 0;

    const avgPnL =
      totalExitedTrades > 0
        ? Number((totalPnL / totalExitedTrades).toFixed(2))
        : 0;

    const avgRR =
      totalExitedTrades > 0
        ? Number((totalRR / totalExitedTrades).toFixed(2))
        : 0;

    const avgRiskAmount =
      totalExitedTrades > 0
        ? Number((totalRiskAmount / totalExitedTrades).toFixed(2))
        : 0;

    const profitFactor =
      totalLoss !== 0
        ? Number((totalProfit / Math.abs(totalLoss)).toFixed(2))
        : null;

    /** ---------------- TIME SERIES ---------------- */
    const tradesTimeSeries = await Trade.aggregate([
      {
        $match: {
          accountId: accountObjectId,
          tradeStatus: "exited",
          pnl: { $ne: null },
          dateTime: { $type: "date" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$dateTime",
            },
          },
          totalTrades: { $sum: 1 },
          totalPnL: { $sum: "$pnl" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const tradesPerDay = tradesTimeSeries.map((d) => ({
      date: d._id,
      count: d.totalTrades,
    }));

    const pnlPerDay = tradesTimeSeries.map((d) => ({
      date: d._id,
      pnl: Number(d.totalPnL.toFixed(2)),
    }));

    /** ---------------- RESPONSE ---------------- */
    return res.status(200).json({
      summary: {
        totalTrades,
        totalLiveTrades,
        totalExitedTrades,
        totalLongTrades,
        totalShortTrades,
        winningTrades,
        losingTrades,
        winRate,
        totalPnL: Number(totalPnL.toFixed(2)),
        avgPnL,
        avgRR,
        avgRiskAmount,
      },
      performance: {
        totalProfit: Number(totalProfit.toFixed(2)),
        totalLoss: Number(totalLoss.toFixed(2)),
        profitFactor,
      },
      charts: {
        tradesPerDay,
        pnlPerDay,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get trade stats",
      error: error.message,
    });
  }
};

module.exports = {
  getAllAccounts,
  getAccountByID,
  editAccountDetails,
  getTradesByAccountId,
  getAccountPerformance,
};
