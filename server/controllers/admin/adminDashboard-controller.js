const mongoose = require("mongoose");
const Trades = require("../../models/trade-model");

const getAdminTradeStats = async (req, res) => {
  try {
    // Route is: /api/admin/account/performance/:id
    const { id: accountId } = req.params;

    if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }

    const accountObjectId = new mongoose.Types.ObjectId(accountId);

    /** ---------------- SUMMARY STATS ---------------- */
    const summaryResult = await Trades.aggregate([
      {
        $match: {
          accountId: accountObjectId,
        },
      },
      {
        $facet: {
          totals: [
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
                    $cond: [
                      { $eq: ["$tradeStatus", "exited"] },
                      "$riskAmount",
                      0,
                    ],
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
          ],
        },
      },
    ]);

    const stats = summaryResult[0]?.totals[0] || {};

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
    const tradesTimeSeries = await Trades.aggregate([
      {
        $match: {
          accountId: accountObjectId,
          tradeStatus: "exited",
          pnl: { $ne: null },
          dateTime: { $exists: true, $ne: null },
        },
      },
      {
        $addFields: {
          tradeDate: { $toDate: "$dateTime" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$tradeDate",
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
    console.error(error);
    res.status(500).json({ message: "Failed to get trade stats" });
  }
};

module.exports = { getAdminTradeStats };
