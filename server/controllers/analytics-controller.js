const mongoose = require("mongoose");
const {
  getAnalyticsByDimension,
  DIMENSION_CONFIG,
  SORT_FIELD_MAP,
} = require("../services/analytics-service");

const getAnalyticsController = async (req, res) => {
  try {
    const userId = req.userID || req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      dimension,
      accountId,
      startDate,
      endDate,
      minTrades = 0,
      sortBy = "expectancy",
      order = "desc",
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

    if (startDate && Number.isNaN(new Date(startDate).getTime())) {
      return res.status(400).json({ message: "Invalid startDate" });
    }

    if (endDate && Number.isNaN(new Date(endDate).getTime())) {
      return res.status(400).json({ message: "Invalid endDate" });
    }

    const parsedMinTrades = Number.parseInt(minTrades, 10);
    if (Number.isNaN(parsedMinTrades) || parsedMinTrades < 0) {
      return res
        .status(400)
        .json({ message: "minTrades must be a non-negative integer" });
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
      startDate,
      endDate,
      minTrades: parsedMinTrades,
      sortBy,
      order,
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
