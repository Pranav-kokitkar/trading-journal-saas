const mongoose = require("mongoose");
const User = require("../models/user-model");
const { hasEffectiveProAccess } = require("../services/pro-access-service");
const {
  getAnalyticsByDimension,
  DIMENSION_CONFIG,
  SORT_FIELD_MAP,
} = require("../services/analytics-service");

const parseIncludeImported = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === "")
    return defaultValue;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  return defaultValue;
};

const getAnalyticsController = async (req, res) => {
  try {
    const userId = req.userID || req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      dimension,
      accountId,
      strategyId,
      startDate,
      endDate,
      minTrades = 0,
      sortBy = "expectancy",
      order = "desc",
      includeImported = "true",
    } = req.query;

    if (!dimension || !DIMENSION_CONFIG[dimension]) {
      return res.status(400).json({
        message: "Invalid or missing dimension",
        allowedDimensions: Object.keys(DIMENSION_CONFIG),
      });
    }

    if (accountId && !mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: "Invalid accountId" });
    }
    if (strategyId && !mongoose.Types.ObjectId.isValid(strategyId)) {
      return res.status(400).json({ message: "Invalid strategyId" });
    }

    const parsedMinTrades = Number.parseInt(minTrades, 10);
    if (Number.isNaN(parsedMinTrades) || parsedMinTrades < 0) {
      return res
        .status(400)
        .json({ message: "minTrades must be a non-negative integer" });
    }

    const user = await User.findById(userId).select("plan planExpiresAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    const isPro = await hasEffectiveProAccess(user);
    if (
      !isPro &&
      (startDate ||
        endDate ||
        parsedMinTrades > 0 ||
        sortBy !== "expectancy" ||
        order !== "desc" ||
        parseIncludeImported(includeImported, true) === false)
    ) {
      return res.status(403).json({
        message:
          "Date, minimum-trade, sorting, ordering, and imported-trade analytics filters are available on the Pro plan. Upgrade to Pro.",
        code: "PRO_ANALYTICS_FILTER_REQUIRED",
      });
    }

    if (accountId) {
      const ownsAccount = await require("../models/account-model").exists({
        _id: accountId,
        userId,
        deleted: { $ne: true },
      });
      if (!ownsAccount) return res.status(404).json({ message: "Account not found" });
    }
    if (strategyId) {
      const strategy = await require("../models/strategy-model")
        .findOne({ _id: strategyId, userId })
        .select("accountId")
        .lean();
      if (!strategy) return res.status(404).json({ message: "Strategy not found" });
      if (accountId && String(strategy.accountId) !== String(accountId)) {
        return res.status(400).json({
          message: "Strategy does not belong to the selected account",
        });
      }
    }

    if (startDate && Number.isNaN(new Date(startDate).getTime())) {
      return res.status(400).json({ message: "Invalid startDate" });
    }

    if (endDate && Number.isNaN(new Date(endDate).getTime())) {
      return res.status(400).json({ message: "Invalid endDate" });
    }

    if (sortBy && !SORT_FIELD_MAP[sortBy]) {
      return res.status(400).json({
        message: "Invalid sortBy value",
        allowedSortBy: Object.keys(SORT_FIELD_MAP),
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        message: "order must be asc or desc",
      });
    }

    const analytics = await getAnalyticsByDimension({
      userId,
      dimension,
      accountId,
      strategyId,
      startDate,
      endDate,
      minTrades: parsedMinTrades,
      sortBy,
      order,
      includeImported: parseIncludeImported(includeImported, true),
    });

    return res.status(200).json(analytics);
  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

module.exports = {
  getAnalyticsController,
};
