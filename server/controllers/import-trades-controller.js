const mongoose = require("mongoose");
const Trade = require("../models/trade-model");
const Tags = require("../models/tags-model");
const Strategy = require("../models/strategy-model");
const Account = require("../models/account-model");
const User = require("../models/user-model");
const {
  parseImportRows,
  normalizeTrade,
  buildNormalizedNameMap,
  uniqueObjectIds,
} = require("../utils/trade-import-utils");
const {
  recalculateAccountTrades,
} = require("../services/account-recalculation-service");

const getAccountIdForImport = async (req, userId) => {
  const accountIdFromBody = req.body?.accountId || req.query?.accountId;

  if (accountIdFromBody) {
    if (!mongoose.Types.ObjectId.isValid(accountIdFromBody)) {
      throw new Error("Invalid accountId");
    }

    const account = await Account.findOne({ _id: accountIdFromBody, userId })
      .select("_id")
      .lean();

    if (!account) {
      throw new Error("Account not found or does not belong to this user");
    }

    return account._id;
  }

  const user = await User.findById(userId).select("activeAccountId").lean();
  if (!user?.activeAccountId) {
    throw new Error("No active account found. Please provide accountId");
  }

  return user.activeAccountId;
};

const preloadAndMapTags = async ({ userId, accountId }) => {
  const tags = await Tags.find({ userId, accountId }).select("_id name").lean();
  return buildNormalizedNameMap(tags);
};

const preloadAndMapStrategies = async ({ userId, accountId }) => {
  const strategies = await Strategy.find({ userId, accountId })
    .select("_id name")
    .lean();
  return buildNormalizedNameMap(strategies);
};

const ensureTagMap = async ({
  userId,
  accountId,
  requiredTagNames,
  tagMap,
}) => {
  const missingNames = requiredTagNames.filter((name) => !tagMap.has(name));
  if (missingNames.length === 0) return 0;

  await Tags.insertMany(
    missingNames.map((name) => ({ userId, accountId, name })),
    { ordered: false },
  );

  const insertedTags = await Tags.find({
    userId,
    accountId,
    name: { $in: missingNames },
  })
    .select("_id name")
    .lean();

  let createdCount = 0;
  for (const tag of insertedTags) {
    const normalized = String(tag.name).trim().toLowerCase();
    if (!tagMap.has(normalized)) {
      createdCount += 1;
      tagMap.set(normalized, tag);
    }
  }

  return createdCount;
};

const ensureStrategyMap = async ({
  userId,
  accountId,
  requiredStrategyNames,
  strategyMap,
}) => {
  const missingNames = requiredStrategyNames.filter(
    (name) => !strategyMap.has(name),
  );
  if (missingNames.length === 0) return 0;

  await Strategy.insertMany(
    missingNames.map((name) => ({ userId, accountId, name })),
    { ordered: false },
  );

  const insertedStrategies = await Strategy.find({
    userId,
    accountId,
    name: { $in: missingNames },
  })
    .select("_id name")
    .lean();

  let createdCount = 0;
  for (const strategy of insertedStrategies) {
    const normalized = String(strategy.name).trim().toLowerCase();
    if (!strategyMap.has(normalized)) {
      createdCount += 1;
      strategyMap.set(normalized, strategy);
    }
  }

  return createdCount;
};

const importTradesController = async (req, res) => {
  const failedRows = [];
  let recalculatedTrades = 0;
  let finalBalance = 0;

  try {
    const userId = req.userID || req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const accountId = await getAccountIdForImport(req, userId);

    let inputRows = [];
    try {
      inputRows = parseImportRows(req);
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Invalid import payload", error: error.message });
    }

    if (!Array.isArray(inputRows) || inputRows.length === 0) {
      return res.status(400).json({ message: "No trades found to import" });
    }

    const normalizedRows = [];
    const tagNameSet = new Set();
    const strategyNameSet = new Set();

    inputRows.forEach((row, index) => {
      const { normalized, error } = normalizeTrade(row);

      if (error) {
        failedRows.push({
          row: index + 1,
          reason: error,
        });
        return;
      }

      normalizedRows.push({
        rowNumber: index + 1,
        row,
        normalized,
      });

      normalized.tagNames.forEach((tagName) => tagNameSet.add(tagName));
      if (normalized.strategyName) strategyNameSet.add(normalized.strategyName);
    });

    if (normalizedRows.length === 0) {
      return res.status(200).json({
        totalImported: 0,
        tagsCreated: 0,
        strategiesCreated: 0,
        failedRows,
      });
    }

    const [tagMap, strategyMap] = await Promise.all([
      preloadAndMapTags({ userId, accountId }),
      preloadAndMapStrategies({ userId, accountId }),
    ]);

    const tagsCreated = await ensureTagMap({
      userId,
      accountId,
      requiredTagNames: [...tagNameSet],
      tagMap,
    });

    const strategiesCreated = await ensureStrategyMap({
      userId,
      accountId,
      requiredStrategyNames: [...strategyNameSet],
      strategyMap,
    });

    const tradeDocsWithMeta = normalizedRows.map(
      ({ rowNumber, row, normalized }) => {
        const tagIds = uniqueObjectIds(
          normalized.tagNames
            .map((tagName) => tagMap.get(tagName)?._id)
            .filter(Boolean),
        );

        const strategyId = normalized.strategyName
          ? strategyMap.get(normalized.strategyName)?._id
          : undefined;

        return {
          rowNumber,
          row,
          trade: {
            userId,
            accountId,
            marketType: normalized.marketType,
            symbol: normalized.symbol,
            tradeDirection: normalized.tradeDirection,
            entryPrice: normalized.entryPrice,
            stoplossPrice: normalized.stoplossPrice,
            takeProfitPrice: normalized.takeProfitPrice,
            exitedPrice: Array.isArray(normalized.exitedPrice)
              ? normalized.exitedPrice
              : [],
            dateTime: normalized.dateTime,
            tags: tagIds,
            strategy: strategyId,
            tradeStatus: normalized.tradeStatus,
            tradeResult: normalized.tradeResult,
            isImported: true,
            rr: Number.isFinite(normalized.rr) ? normalized.rr : 0,
            pnl: Number.isFinite(normalized.pnl) ? normalized.pnl : 0,
            riskAmount: Number.isFinite(normalized.riskAmount)
              ? normalized.riskAmount
              : 0,
            riskPercent: Number.isFinite(normalized.riskPercent)
              ? normalized.riskPercent
              : 0,
            balanceAfterTrade: Number.isFinite(normalized.balanceAfterTrade)
              ? normalized.balanceAfterTrade
              : 0,
            tradeNumber: Number.isFinite(normalized.tradeNumber)
              ? normalized.tradeNumber
              : 0,
            tradeNotes: normalized.tradeNotes,
          },
        };
      },
    );

    const tradeDocs = tradeDocsWithMeta.map((item) => item.trade);

    let totalImported = 0;

    try {
      const insertedTrades = await Trade.insertMany(tradeDocs, {
        ordered: false,
      });
      totalImported = insertedTrades.length;
    } catch (error) {
      totalImported = Array.isArray(error.insertedDocs)
        ? error.insertedDocs.length
        : 0;

      if (Array.isArray(error.writeErrors)) {
        for (const writeError of error.writeErrors) {
          const erroredTrade = tradeDocsWithMeta[writeError.index];
          if (!erroredTrade) continue;

          failedRows.push({
            row: erroredTrade.rowNumber,
            reason: writeError.errmsg || "Failed to insert trade",
          });
        }
      } else {
        failedRows.push({ reason: error.message || "Trade import failed" });
      }
    }

    ({ recalculatedTrades, finalBalance } = await recalculateAccountTrades({
      userId,
      accountId,
    }));

    return res.status(200).json({
      totalImported,
      tagsCreated,
      strategiesCreated,
      recalculatedTrades,
      finalBalance,
      failedRows,
    });
  } catch (error) {
    console.error("importTradesController error:", error);

    return res.status(500).json({
      message: "Failed to import trades",
      totalImported: 0,
      tagsCreated: 0,
      strategiesCreated: 0,
      recalculatedTrades,
      finalBalance,
      failedRows,
    });
  }
};

module.exports = { importTradesController };
