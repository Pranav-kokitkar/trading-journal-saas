const mongoose = require("mongoose");
const Trade = require("../models/trade-model");

const DIMENSION_CONFIG = {
  strategy: { field: "strategy", unwind: false },
  session: { field: "session", unwind: false },
  symbol: { field: "symbol", unwind: false },
  direction: { field: "tradeDirection", unwind: false },
  marketType: { field: "marketType", unwind: false },
  tag: { field: "tags", unwind: true },
  duration: { field: "durationBucket", unwind: false },
};

const SORT_FIELD_MAP = {
  expectancy: "expectancy",
  winRate: "winRate",
  totalPnL: "totalPnL",
};

const normalizeDateRange = (startDate, endDate) => {
  const dateFilter = {};

  if (startDate) {
    const parsedStart = new Date(startDate);
    if (!Number.isNaN(parsedStart.getTime())) {
      dateFilter.$gte = parsedStart;
    }
  }

  if (endDate) {
    const parsedEnd = new Date(endDate);
    if (!Number.isNaN(parsedEnd.getTime())) {
      parsedEnd.setHours(23, 59, 59, 999);
      dateFilter.$lte = parsedEnd;
    }
  }

  return dateFilter;
};

const getAnalyticsByDimension = async ({
  userId,
  dimension,
  accountId,
  startDate,
  endDate,
  minTrades = 0,
  sortBy = "expectancy",
  order = "desc",
  includeImported = true,
}) => {
  const config = DIMENSION_CONFIG[dimension];
  const sortField = SORT_FIELD_MAP[sortBy] || "expectancy";
  const sortOrder = order === "asc" ? 1 : -1;

  const baseMatch = {
    userId: new mongoose.Types.ObjectId(userId),
    tradeStatus: "exited",
    pnl: { $type: "number" },
    rr: { $type: "number" },
  };

  if (accountId) {
    baseMatch.accountId = new mongoose.Types.ObjectId(accountId);
  }

  if (!includeImported) {
    baseMatch.isImported = false;
  }

  const dateRange = normalizeDateRange(startDate, endDate);
  if (Object.keys(dateRange).length > 0) {
    baseMatch.dateTime = dateRange;
  }

  if (config.unwind) {
    baseMatch[config.field] = { $exists: true, $ne: [] };
  } else if (dimension !== "duration") {
    if (
      config.field === "symbol" ||
      config.field === "session" ||
      config.field === "marketType" ||
      config.field === "tradeDirection"
    ) {
      baseMatch[config.field] = { $exists: true, $nin: [null, ""] };
    } else {
      baseMatch[config.field] = { $exists: true, $ne: null };
    }
  }

  const pipeline = [
    { $match: baseMatch },
    {
      $addFields: {
        normalizedResult: {
          $toLower: { $ifNull: ["$tradeResult", ""] },
        },
      },
    },
    {
      $match: {
        normalizedResult: { $in: ["win", "loss", "breakeven"] },
      },
    },
  ];

  if (dimension === "duration") {
    pipeline.push({
      $addFields: {
        resolvedDurationMinutes: {
          $cond: [
            {
              $and: [
                { $ne: ["$durationMinutes", null] },
                { $gte: ["$durationMinutes", 0] },
              ],
            },
            "$durationMinutes",
            {
              $cond: [
                {
                  $and: [
                    { $ne: ["$entryTime", null] },
                    { $ne: ["$exitTime", null] },
                  ],
                },
                {
                  $round: [
                    {
                      $divide: [
                        { $subtract: ["$exitTime", "$entryTime"] },
                        60000,
                      ],
                    },
                    2,
                  ],
                },
                null,
              ],
            },
          ],
        },
      },
    });

    pipeline.push({
      $addFields: {
        durationBucket: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$resolvedDurationMinutes", null] },
                then: "Unknown",
              },
              {
                case: { $lt: ["$resolvedDurationMinutes", 15] },
                then: "Scalp (< 15m)",
              },
              {
                case: { $lt: ["$resolvedDurationMinutes", 60] },
                then: "Intraday (15m-1h)",
              },
              {
                case: { $lt: ["$resolvedDurationMinutes", 240] },
                then: "Day Trade (1h-4h)",
              },
              {
                case: { $lt: ["$resolvedDurationMinutes", 1440] },
                then: "Swing (4h-1d)",
              },
            ],
            default: "Position (1d+)",
          },
        },
      },
    });
  }

  if (config.unwind) {
    pipeline.push({ $unwind: `$${config.field}` });
    pipeline.push({ $match: { [config.field]: { $ne: null } } });

    // For tags, lookup the tag name first
    if (dimension === "tag") {
      pipeline.push({
        $lookup: {
          from: "tags",
          localField: "tags",
          foreignField: "_id",
          as: "tagDoc",
        },
      });
      pipeline.push({
        $unwind: {
          path: "$tagDoc",
          preserveNullAndEmptyArrays: true,
        },
      });
    }
  } else if (dimension === "strategy") {
    // For strategies (non-unwind), lookup strategy name first
    pipeline.push({
      $lookup: {
        from: "strategies",
        localField: "strategy",
        foreignField: "_id",
        as: "strategyDoc",
      },
    });
    pipeline.push({
      $unwind: {
        path: "$strategyDoc",
        preserveNullAndEmptyArrays: true,
      },
    });
  } else if (dimension === "duration") {
    pipeline.push({
      $addFields: {
        displayName: "$durationBucket",
      },
    });
  }

  pipeline.push({
    $group: {
      _id:
        dimension === "tag"
          ? { $toLower: "$tagDoc.name" }
          : dimension === "strategy"
            ? { $toLower: "$strategyDoc.name" }
            : `$${config.field}`,
      totalTrades: { $sum: 1 },
      wins: {
        $sum: {
          $cond: [{ $eq: ["$normalizedResult", "win"] }, 1, 0],
        },
      },
      losses: {
        $sum: {
          $cond: [{ $eq: ["$normalizedResult", "loss"] }, 1, 0],
        },
      },
      breakevens: {
        $sum: {
          $cond: [{ $eq: ["$normalizedResult", "breakeven"] }, 1, 0],
        },
      },
      totalPnL: { $sum: "$pnl" },
      avgPnL: { $avg: "$pnl" },
      avgRR: { $avg: "$rr" },
      totalProfit: {
        $sum: {
          $cond: [{ $gt: ["$pnl", 0] }, "$pnl", 0],
        },
      },
      totalLossAbs: {
        $sum: {
          $cond: [{ $lt: ["$pnl", 0] }, { $abs: "$pnl" }, 0],
        },
      },
      sumWinRR: {
        $sum: {
          $cond: [{ $eq: ["$normalizedResult", "win"] }, "$rr", 0],
        },
      },
      sumLossRRAbs: {
        $sum: {
          $cond: [{ $eq: ["$normalizedResult", "loss"] }, { $abs: "$rr" }, 0],
        },
      },
    },
  });

  if (dimension === "strategy") {
    // Strategy name already normalized during grouping via strategyDoc.name
    pipeline.push({
      $addFields: {
        displayName: "$_id",
      },
    });
  } else if (dimension === "tag") {
    // Tag name already normalized during grouping via tagDoc.name
    pipeline.push({
      $addFields: {
        displayName: "$_id",
      },
    });
  } else {
    // Other dimensions (session, symbol, direction, marketType)
    pipeline.push({
      $addFields: {
        displayName: { $toString: "$_id" },
      },
    });
  }

  pipeline.push({
    $addFields: {
      winRateRatio: {
        $cond: [
          { $gt: ["$totalTrades", 0] },
          { $divide: ["$wins", "$totalTrades"] },
          0,
        ],
      },
      avgWinRR: {
        $cond: [{ $gt: ["$wins", 0] }, { $divide: ["$sumWinRR", "$wins"] }, 0],
      },
      avgLossRR: {
        $cond: [
          { $gt: ["$losses", 0] },
          { $divide: ["$sumLossRRAbs", "$losses"] },
          0,
        ],
      },
    },
  });

  pipeline.push({
    $project: {
      _id: 0,
      key: "$_id",
      name: "$displayName",
      totalTrades: 1,
      wins: 1,
      losses: 1,
      breakevens: 1,
      winRate: { $round: [{ $multiply: ["$winRateRatio", 100] }, 2] },
      totalPnL: { $round: ["$totalPnL", 2] },
      avgPnL: { $round: ["$avgPnL", 2] },
      avgRR: { $round: ["$avgRR", 2] },
      avgWinRR: { $round: ["$avgWinRR", 2] },
      avgLossRR: { $round: ["$avgLossRR", 2] },
      expectancy: {
        $round: [
          {
            $subtract: [
              { $multiply: ["$winRateRatio", "$avgWinRR"] },
              {
                $multiply: [{ $subtract: [1, "$winRateRatio"] }, "$avgLossRR"],
              },
            ],
          },
          2,
        ],
      },
      profitFactor: {
        $cond: [
          { $gt: ["$totalLossAbs", 0] },
          {
            $round: [{ $divide: ["$totalProfit", "$totalLossAbs"] }, 2],
          },
          null,
        ],
      },
    },
  });

  pipeline.push({
    $match: {
      totalTrades: { $gte: Math.max(0, Number(minTrades) || 0) },
    },
  });

  pipeline.push({ $sort: { [sortField]: sortOrder, totalTrades: -1 } });

  return Trade.aggregate(pipeline);
};

module.exports = {
  getAnalyticsByDimension,
  DIMENSION_CONFIG,
  SORT_FIELD_MAP,
};
