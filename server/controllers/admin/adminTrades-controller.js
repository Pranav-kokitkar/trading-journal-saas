const Trades = require("../../models/trade-model");
const mongoose = require("mongoose");

const getAllTrades = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const trades = await Trades.find()
      .skip(skip)
      .limit(limit)
      .populate("userId", "email name")
      .populate("accountId", "name status");

    const totalTrades = await Trades.countDocuments();
    const totalLiveTrades = await Trades.countDocuments({
      tradeStatus: "live",
    });
    const totalExitedTrades = await Trades.countDocuments({
      tradeStatus: "exited",
    });

    res.status(200).json({
      trades,
      stats: { totalTrades, totalExitedTrades, totalLiveTrades },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTrades / limit),
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "error from backend while getting all tardes for admin",
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
