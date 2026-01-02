const User = require("../models/user-model");

const getUser = async (req, res) => {
  try {
    const userId = req.userID;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user id missing" });
    }

    const user = await User.findById(userId).select(
      "name email initialCapital balance totalTrades activeAccountId"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
    return res.status(200).json(user);
  } catch (error) {
    console.error("getAccount error:", error);
    return res.status(500).json({
      message: "Failed to fetch account details from server",
      error: error.message || "Unknown error",
    });
  }
};

const updateUser = async (req, res, next) => {
  try {
    const userId = req.userID;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user id missing" });
    }

    const { pnl, deltaTrades } = req.body;

    if (pnl === undefined || typeof pnl !== "number") {
      return res.status(400).json({ message: "pnl must be a number" });
    }

    if (deltaTrades !== undefined && typeof deltaTrades !== "number") {
      return res.status(400).json({ message: "deltaTrades must be a number" });
    }

    const incObj = {
      balance: pnl,
      totalTrades: deltaTrades ?? 0,
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: incObj },
      { new: true }
    ).select("name email initialCapital balance totalTrades activeAccountId");

    return res.status(200).json({
      message: "Account updated successfully",
      account: updatedUser,
    });
  } catch (error) {
    console.log("updateAcoount error:", error);
    return res.status(500).json({
      message: "failed to update account details",
      error: error.message || "Unknown error",
    });
  }
};

const setActiveAccount = async (req, res) => {
  try {
    const userId = req.userID;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user id missing" });
    }

    const { activeAccountId } = req.body;

    if (!activeAccountId) {
      return res.status(400).json({ message: "activeAccountId is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { activeAccountId },
      { new: true }
    ).select("name email initialCapital balance totalTrades activeAccountId");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Active account updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("setActiveAccount error:", error);
    return res.status(500).json({
      message: "Failed to update active account",
      error: error.message || "Unknown error",
    });
  }
};

module.exports = { getUser, updateUser, setActiveAccount };
