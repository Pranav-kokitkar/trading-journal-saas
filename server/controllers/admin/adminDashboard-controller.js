const mongoose = require("mongoose");
const Trades = require("../../models/trade-model");
const Accounts = require("../../models/account-model");
const Users = require("../../models/user-model");
const Contacts = require("../../models/contact-model");

const getStats = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    /** ================= CONTACTS ================= */
    const contactData = await Contacts.aggregate([
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalContacts: { $sum: 1 },
                open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
                inProgress: {
                  $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
                },
                resolved: {
                  $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
                },
              },
            },
          ],
          statusDistribution: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { _id: 0, status: "$_id", count: 1 } },
          ],
        },
      },
    ]);

    /** ================= ACCOUNTS ================= */
    const accountData = await Accounts.aggregate([
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalAccounts: { $sum: 1 },
                activeAccounts: {
                  $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                },
                inactiveAccounts: {
                  $sum: { $cond: [{ $ne: ["$status", "active"] }, 1, 0] },
                },
                totalCapital: { $sum: "$initialCapital" },
                totalBalance: { $sum: "$currentBalance" },
                totalTrades: { $sum: "$totalTrades" },
              },
            },
            {
              $project: {
                _id: 0,
                totalAccounts: 1,
                activeAccounts: 1,
                inactiveAccounts: 1,
                totalCapital: 1,
                totalBalance: 1,
                totalTrades: 1,
                avgTradesPerAccount: {
                  $cond: [
                    { $eq: ["$totalAccounts", 0] },
                    0,
                    { $divide: ["$totalTrades", "$totalAccounts"] },
                  ],
                },
              },
            },
          ],
          accountsOverTime: [
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: "$_id", count: 1 } },
          ],
          capitalVsBalance: [
            {
              $project: {
                _id: 0,
                name: 1,
                initialCapital: 1,
                currentBalance: 1,
              },
            },
          ],
        },
      },
    ]);

    /** ================= USERS ================= */
    const userData = await Users.aggregate([
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                adminUsers: {
                  $sum: { $cond: [{ $eq: ["$isAdmin", true] }, 1, 0] },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalUsers: 1,
                adminUsers: 1,
                regularUsers: { $subtract: ["$totalUsers", "$adminUsers"] },
              },
            },
          ],
          usersOverTime: [
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: "$_id", count: 1 } },
          ],
        },
      },
    ]);

    const avgAccountsPerUserAgg = await Accounts.aggregate([
      { $group: { _id: "$userId", accountCount: { $sum: 1 } } },
      { $group: { _id: null, avgAccountsPerUser: { $avg: "$accountCount" } } },
    ]);

    /** ================= TRADES ================= */
    const tradeData = await Trades.aggregate([
      { $match: { tradeStatus: "exited" } },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalTrades: { $sum: 1 },
                wins: {
                  $sum: { $cond: [{ $eq: ["$tradeResult", "win"] }, 1, 0] },
                },
                losses: {
                  $sum: { $cond: [{ $eq: ["$tradeResult", "loss"] }, 1, 0] },
                },
                breakeven: {
                  $sum: {
                    $cond: [{ $eq: ["$tradeResult", "breakeven"] }, 1, 0],
                  },
                },
              },
            },
          ],

          tradesOverTime: [
            { $match: { dateTime: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$dateTime" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: "$_id", count: 1 } },
          ],

          directionDistribution: [
            { $group: { _id: "$tradeDirection", count: { $sum: 1 } } },
            { $project: { _id: 0, direction: "$_id", count: 1 } },
          ],

          resultDistribution: [
            { $group: { _id: "$tradeResult", count: { $sum: 1 } } },
            { $project: { _id: 0, result: "$_id", count: 1 } },
          ],

          riskDistribution: [
            {
              $bucket: {
                groupBy: "$riskPercent",
                boundaries: [0, 1, 2, 3, 5, 10],
                default: "10%+",
                output: { count: { $sum: 1 } },
              },
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      contacts: {
        cards: {
          totalContacts: contactData[0].stats[0]?.totalContacts || 0,
          open: contactData[0].stats[0]?.open || 0,
          inProgress: contactData[0].stats[0]?.inProgress || 0,
          resolved: contactData[0].stats[0]?.resolved || 0,
        },
        charts: { statusDistribution: contactData[0].statusDistribution },
      },

      accounts: {
        cards: accountData[0].stats[0] || {},
        charts: {
          accountsOverTime: accountData[0].accountsOverTime,
          capitalVsBalance: accountData[0].capitalVsBalance,
        },
      },

      users: {
        cards: {
          ...userData[0].stats[0],
          avgAccountsPerUser: avgAccountsPerUserAgg[0]?.avgAccountsPerUser || 0,
        },
        charts: {
          usersOverTime: userData[0].usersOverTime,
          userRoleDistribution: [
            { role: "admin", count: userData[0].stats[0]?.adminUsers || 0 },
            { role: "user", count: userData[0].stats[0]?.regularUsers || 0 },
          ],
        },
      },

      trades: {
        cards: tradeData[0].stats[0] || {},
        charts: {
          tradesOverTime: tradeData[0].tradesOverTime,
          directionDistribution: tradeData[0].directionDistribution,
          resultDistribution: tradeData[0].resultDistribution,
          riskDistribution: tradeData[0].riskDistribution,
        },
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
};

module.exports = { getStats };
