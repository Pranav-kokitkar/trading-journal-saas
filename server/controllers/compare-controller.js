const Trade = require("../models/trade-model");
const Account = require("../models/account-model");
const mongoose = require("mongoose");
const User = require("../models/user-model");
const { getMaxCompareDimensions } = require("../config/planLimits");

const parseIncludeImported = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === "")
    return defaultValue;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  return defaultValue;
};

// Allowed dimension keys for validation
const ALLOWED_DIMENSIONS = [
  "accountId",
  "strategy",
  "symbol",
  "direction",
  "tag",
  "marketType",
  "tradeStatus",
];

/**
 * Generate chart data from trades
 * @param {Array} trades - Array of trade documents (sorted by date)
 * @returns {Object} Chart data object
 */
const generateChartData = (trades) => {
  if (!trades || trades.length === 0) {
    return {
      equityCurve: [],
      expectancyProgression: [],
    };
  }

  // Filter only exited trades and sort by date
  const exitedTrades = trades
    .filter((t) => t.tradeStatus === "exited")
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  let cumulativePnL = 0;
  let cumulativeR = 0;
  let runningWins = 0;
  let runningLosses = 0;
  let runningTotalPnL = 0;

  const equityCurve = [];
  const expectancyProgression = [];

  exitedTrades.forEach((trade, index) => {
    const pnl = trade.pnl || 0;
    const rValue = trade.rr || 0;

    cumulativePnL += pnl;
    cumulativeR += rValue;
    runningTotalPnL += pnl;

    if (trade.tradeResult === "win") {
      runningWins++;
    } else if (trade.tradeResult === "loss") {
      runningLosses++;
    }

    const tradeNumber = index + 1;
    const runningTotalTrades = tradeNumber;
    const runningExpectancy =
      runningTotalTrades > 0 ? runningTotalPnL / runningTotalTrades : 0;

    equityCurve.push({
      tradeNumber,
      cumulativePnL: parseFloat(cumulativePnL.toFixed(2)),
      cumulativeR: parseFloat(cumulativeR.toFixed(2)),
    });

    expectancyProgression.push({
      tradeNumber,
      expectancy: parseFloat(runningExpectancy.toFixed(2)),
    });
  });

  return {
    equityCurve,
    expectancyProgression,
  };
};

/**
 * Calculate trading statistics from trades array
 * @param {Array} trades - Array of trade documents
 * @returns {Object} Statistics object
 */
const calculateStats = (trades) => {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      exitedTrades: 0,
      liveTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalR: 0,
      avgR: 0,
      expectancy: 0,
      profitFactor: 0,
    };
  }

  const totalTrades = trades.length;
  let liveTrades = 0;
  let wins = 0;
  let losses = 0;
  let totalR = 0;
  let totalWinR = 0;
  let totalLossR = 0;
  let totalPnL = 0;
  let totalWinPnL = 0;
  let totalLossPnL = 0;

  trades.forEach((trade) => {
    // Skip live trades from statistics calculations
    if (trade.tradeStatus === "live") {
      liveTrades++;
      return;
    }

    const rValue = trade.rr || 0;
    const pnlValue = trade.pnl || 0;

    totalR += rValue;
    totalPnL += pnlValue;

    if (trade.tradeResult === "win") {
      wins++;
      totalWinR += Math.abs(rValue);
      totalWinPnL += Math.abs(pnlValue);
    } else if (trade.tradeResult === "loss") {
      losses++;
      totalLossR += Math.abs(rValue);
      totalLossPnL += Math.abs(pnlValue);
    }
  });

  const exitedTrades = totalTrades - liveTrades;
  const winRate = exitedTrades > 0 ? (wins / exitedTrades) * 100 : 0;
  const avgR = exitedTrades > 0 ? totalR / exitedTrades : 0;
  const expectancy = exitedTrades > 0 ? totalPnL / exitedTrades : 0;
  const expectancyR = avgR;
  const avgWin = wins > 0 ? totalWinR / wins : 0;
  const avgWinPnL = wins > 0 ? totalWinPnL / wins : 0;
  const avgLoss = losses > 0 ? totalLossR / losses : 0;
  const avgLossPnL = losses > 0 ? totalLossPnL / losses : 0;
  const riskRewardRatio =
    avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 0;

  // Profit factor calculation
  let profitFactor = 0;
  if (totalLossR > 0) {
    profitFactor = totalWinR / totalLossR;
  } else if (totalWinR > 0) {
    // All wins, no losses - set to a high number or infinity representation
    profitFactor = 999; // Represents infinity/unlimited
  }

  return {
    totalTrades,
    exitedTrades,
    liveTrades,
    wins,
    losses,
    winRate: parseFloat(winRate.toFixed(2)),
    totalR: parseFloat(totalR.toFixed(2)),
    avgR: parseFloat(avgR.toFixed(2)),
    expectancy: parseFloat(expectancy.toFixed(2)),
    expectancyR: parseFloat(expectancyR.toFixed(2)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgWinPnL: parseFloat(avgWinPnL.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    avgLossPnL: parseFloat(avgLossPnL.toFixed(2)),
    riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
  };
};

/**
 * Build MongoDB query object from dimension value
 * @param {String} key - Dimension key
 * @param {String} value - Dimension value
 * @returns {Object} Query object or null if value is invalid
 */
const buildQueryCondition = (key, value) => {
  // Skip if value is empty or undefined
  if (!value || value === "") {
    return null;
  }

  // Special case: tag should match inside tags array
  if (key === "tag") {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error(`Invalid tag ID: ${value}`);
    }
    return { tags: new mongoose.Types.ObjectId(value) };
  }

  // Special case: direction maps to tradeDirection field
  if (key === "direction") {
    return { tradeDirection: value };
  }

  // Handle ObjectId fields
  if (key === "accountId" || key === "strategy") {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error(`Invalid ${key} format: ${value}`);
    }
    return {
      [key]: new mongoose.Types.ObjectId(value),
    };
  }

  // Default: direct field match
  return { [key]: value };
};

/**
 * POST /compare - Compare two datasets of trades
 */
const Compare = async (req, res) => {
  try {
    const { dimensions } = req.body;
    const shouldIncludeImported = parseIncludeImported(
      req.body?.includeImported,
      true,
    );

    // Validate user is authenticated
    const userId = req.userID || req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Validate dimensions object exists
    if (!dimensions || typeof dimensions !== "object") {
      return res.status(400).json({
        message: "Dimensions object required",
        example: {
          dimensions: {
            tag: { A: "tagId1", B: "tagId2" },
            direction: { A: "long", B: "short" },
          },
        },
      });
    }

    // Validate dimension keys
    const dimensionKeys = Object.keys(dimensions);

    if (dimensionKeys.length === 0) {
      return res.status(400).json({
        message: "At least one dimension required for comparison",
        allowedKeys: ALLOWED_DIMENSIONS,
      });
    }

    const user = await User.findById(userId).select("plan planExpiresAt");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPro =
      user.plan === "pro" &&
      user.planExpiresAt &&
      new Date(user.planExpiresAt) > new Date();

    const maxCompareDimensions = getMaxCompareDimensions(isPro);
    if (dimensionKeys.length > maxCompareDimensions) {
      return res.status(403).json({
        message: isPro
          ? `You can compare up to ${maxCompareDimensions} dimensions.`
          : "Buy Pro to add more comparison dimensions.",
      });
    }

    const invalidKeys = dimensionKeys.filter(
      (key) => !ALLOWED_DIMENSIONS.includes(key),
    );

    if (invalidKeys.length > 0) {
      return res.status(400).json({
        message: `Invalid dimension keys: ${invalidKeys.join(", ")}`,
        allowedKeys: ALLOWED_DIMENSIONS,
      });
    }

    // Validate each dimension structure (can have A, B, or both)
    for (const key of dimensionKeys) {
      if (!dimensions[key] || typeof dimensions[key] !== "object") {
        return res.status(400).json({
          message: `Dimension '${key}' must be an object`,
          received: dimensions[key],
        });
      }

      if (!dimensions[key].A && !dimensions[key].B) {
        return res.status(400).json({
          message: `Dimension '${key}' must have at least A or B value`,
          received: dimensions[key],
        });
      }
    }

    // Get current account from context (from AccountContext in frontend)
    // This would typically be passed in request or stored in user session
    const currentAccountId =
      req.body.currentAccountId || req.headers["x-account-id"];

    // Build query objects for datasets A and B
    const queryA = { userId };
    const queryB = { userId };

    if (!shouldIncludeImported) {
      queryA.isImported = false;
      queryB.isImported = false;
    }

    // Track account IDs for metadata
    let accountAId = null;
    let accountBId = null;

    // Check if accountId dimension is specified
    const hasAccountDimension = dimensionKeys.includes("accountId");

    // If accountId is NOT specified, currentAccountId is MANDATORY
    if (!hasAccountDimension) {
      if (!currentAccountId) {
        return res.status(400).json({
          message:
            "Current account ID required when accountId dimension is not specified. Pass it in body as 'currentAccountId' or header as 'x-account-id'",
        });
      }

      // Validate current account exists
      const currentAccount = await Account.findOne({
        _id: currentAccountId,
        userId,
      });

      if (!currentAccount) {
        return res.status(404).json({
          message: "Current account not found or doesn't belong to you",
          accountId: currentAccountId,
        });
      }

      // Use current account for both datasets
      queryA.accountId = new mongoose.Types.ObjectId(currentAccountId);
      queryB.accountId = new mongoose.Types.ObjectId(currentAccountId);
      accountAId = currentAccountId;
      accountBId = currentAccountId;
    }

    // Process each dimension
    for (const key of dimensionKeys) {
      try {
        if (key === "accountId") {
          // Validate and set accounts
          const valueA = dimensions[key].A;
          const valueB = dimensions[key].B;

          // Validate accounts that are specified
          const accountsToValidate = [];
          if (valueA) accountsToValidate.push({ id: valueA, label: "A" });
          if (valueB) accountsToValidate.push({ id: valueB, label: "B" });

          for (const acc of accountsToValidate) {
            const account = await Account.findOne({ _id: acc.id, userId });
            if (!account) {
              return res.status(404).json({
                message: `Account ${acc.label} not found or doesn't belong to you`,
                accountId: acc.id,
              });
            }
          }

          // Set account IDs for queries
          if (valueA) {
            queryA.accountId = new mongoose.Types.ObjectId(valueA);
            accountAId = valueA;
          }
          if (valueB) {
            queryB.accountId = new mongoose.Types.ObjectId(valueB);
            accountBId = valueB;
          }
        } else {
          // Build conditions for other dimensions (only if value exists)
          if (dimensions[key].A) {
            const conditionA = buildQueryCondition(key, dimensions[key].A);
            if (conditionA) Object.assign(queryA, conditionA);
          }

          if (dimensions[key].B) {
            const conditionB = buildQueryCondition(key, dimensions[key].B);
            if (conditionB) Object.assign(queryB, conditionB);
          }
        }
      } catch (error) {
        return res.status(400).json({
          message: `Invalid value for dimension '${key}'`,
          error: error.message,
        });
      }
    }

    // Fetch trades for both datasets
    const [tradesA, tradesB] = await Promise.all([
      Trade.find(queryA)
        .populate("strategy", "name")
        .populate("tags", "name")
        .sort({ dateTime: -1 })
        .lean(),
      Trade.find(queryB)
        .populate("strategy", "name")
        .populate("tags", "name")
        .sort({ dateTime: -1 })
        .lean(),
    ]);

    // Calculate statistics and chart data
    const datasetA = {
      query: queryA,
      stats: calculateStats(tradesA),
      sampleSize: tradesA.length,
      chartData: generateChartData(tradesA),
    };

    const datasetB = {
      query: queryB,
      stats: calculateStats(tradesB),
      sampleSize: tradesB.length,
      chartData: generateChartData(tradesB),
    };

    // Return comparison results
    return res.status(200).json({
      success: true,
      comparison: {
        datasetA,
        datasetB,
      },
      metadata: {
        dimensionsCompared: dimensionKeys,
        accountA: accountAId,
        accountB: accountBId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Compare endpoint error:", error);
    return res.status(500).json({
      message: "Server error while comparing datasets",
      error: error.message,
    });
  }
};

module.exports = { Compare, calculateStats };
