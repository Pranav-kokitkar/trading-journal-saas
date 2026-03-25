const Trade = require("../models/trade-model");
const Account = require("../models/account-model");

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const writeInChunks = async (operations, chunkSize = 1000) => {
  if (!Array.isArray(operations) || operations.length === 0) return;

  for (let index = 0; index < operations.length; index += chunkSize) {
    const chunk = operations.slice(index, index + chunkSize);
    await Trade.bulkWrite(chunk, { ordered: true });
  }
};

const recalculateAccountTrades = async ({ userId, accountId }) => {
  const account = await Account.findOne({ _id: accountId, userId })
    .select("_id initialCapital")
    .lean();

  if (!account) {
    throw new Error("Account not found for recalculation");
  }

  const trades = await Trade.find({ userId, accountId })
    .select("_id pnl")
    .sort({ dateTime: 1, _id: 1 })
    .lean();

  let runningBalance = toNumber(account.initialCapital);

  if (trades.length > 0) {
    const bulkOps = trades.map((trade, index) => {
      runningBalance += toNumber(trade.pnl);

      return {
        updateOne: {
          filter: { _id: trade._id, userId, accountId },
          update: {
            $set: {
              balanceAfterTrade: runningBalance,
              tradeNumber: index + 1,
            },
          },
        },
      };
    });

    await writeInChunks(bulkOps);
  }

  // Update account with final balance and total trades count
  await Account.updateOne(
    { _id: accountId, userId },
    {
      $set: {
        currentBalance: runningBalance,
        totalTrades: trades.length,
      },
    },
  );

  return {
    recalculatedTrades: trades.length,
    finalBalance: runningBalance,
  };
};

module.exports = {
  recalculateAccountTrades,
};
