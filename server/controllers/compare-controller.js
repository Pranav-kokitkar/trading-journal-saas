const Trade = require("../models/trade-model");
const Account = require("../models/account-model");
const mongoose = require("mongoose");

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
 * Calculate trading statistics from trades array
 * @param {Array} trades - Array of trade documents
 * @returns {Object} Statistics object
 */
const calculateStats = (trades) => {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
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
  let wins = 0;
  let losses = 0;
  let totalR = 0;
  let totalWinR = 0;
  let totalLossR = 0;

  trades.forEach((trade) => {
    const rValue = trade.rr || 0;
    totalR += rValue;

    if (trade.tradeResult === "win") {
      wins++;
      totalWinR += Math.abs(rValue);
    } else if (trade.tradeResult === "loss") {
      losses++;
      totalLossR += Math.abs(rValue);
    }
  });

  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const avgR = totalTrades > 0 ? totalR / totalTrades : 0;
  const expectancy = avgR;
  const profitFactor =
    totalLossR > 0 ? totalWinR / totalLossR : totalWinR > 0 ? Infinity : 0;

  return {
    totalTrades,
    wins,
    losses,
    winRate: parseFloat(winRate.toFixed(2)),
    totalR: parseFloat(totalR.toFixed(2)),
    avgR: parseFloat(avgR.toFixed(2)),
    expectancy: parseFloat(expectancy.toFixed(2)),
    profitFactor:
      profitFactor === Infinity ? "∞" : parseFloat(profitFactor.toFixed(2)),
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

    // Calculate statistics
    const datasetA = {
      query: queryA,
      stats: calculateStats(tradesA),
      sampleSize: tradesA.length,
    };

    const datasetB = {
      query: queryB,
      stats: calculateStats(tradesB),
      sampleSize: tradesB.length,
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
