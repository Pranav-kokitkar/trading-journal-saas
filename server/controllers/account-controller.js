// controllers/account-create-controller.js
const Account = require("../models/account-model");
const User = require("../models/user-model");

// POST /api/account
const createAccount = async (req, res) => {
  try {
    // trust the token for userId, not the body
    const userIdFromToken = req.userID;
    const { userId: userIdFromBody, name, initialCapital } = req.body;

    const userId = userIdFromToken || userIdFromBody;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user id missing" });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Account name is required" });
    }

    if (initialCapital === undefined || initialCapital === null) {
      return res.status(400).json({ message: "initialCapital is required" });
    }

    const capitalNum = Number(initialCapital);
    if (!Number.isFinite(capitalNum) || capitalNum <= 0) {
      return res.status(400).json({
        message: "initialCapital must be a positive number",
      });
    }

    // 1) Create the account; currentBalance will auto = initialCapital via schema default
    const account = await Account.create({
      userId,
      name: name.trim(),
      initialCapital: capitalNum,
      // no currentBalance here → default runs
    });

    // 2) Set this account as active for the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { activeAccountId: account._id },
      { new: true }
    ).select("name email initialCapital balance totalTrades activeAccountId");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "User not found for this account" });
    }

    // 3) Return both account + updated user
    return res.status(201).json({
      message: "Account created successfully",
      account,
      user: updatedUser,
    });
  } catch (error) {
    console.error("createAccount error:", error);
    return res.status(500).json({
      message: "Failed to create account",
      error: error.message || "Unknown error",
    });
  }
};

const getAccounts = async (req, res) => {
  try {
    const userId = req.userID || (req.user && req.user._id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const response = await Account.find({ userId });
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: "error while gettign accounts" });
  }
};

const getAcitveAccount = async (req, res) => {
  try {
    const userId = req.userID || (req.user && req.user._id);
    const user = await User.findById(userId).select("activeAccountId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.activeAccountId) {
      return res
        .status(400)
        .json({ message: "No active account set for this user" });
    }

    const account = await Account.findOne({
      _id: user.activeAccountId,
      userId: userId, // extra safety
    });

    if (!account) {
      return res
        .status(404)
        .json({ message: "Active account not found for this user" });
    }

    return res.status(200).json(account);
  } catch (error) {
    res.status(400).json({ message: "error while getting the active account" });
  }
};

const updateAccount = async (req, res) => {
  try {
    const userId = req.userID;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user id missing" });
    }

    // 1) Get user's activeAccountId
    const user = await User.findById(userId).select("activeAccountId");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.activeAccountId) {
      return res
        .status(400)
        .json({ message: "No active account set for this user" });
    }

    // 2) Validate body
    const { pnl, deltaTrades } = req.body;

    if (pnl === undefined || typeof pnl !== "number") {
      return res.status(400).json({ message: "pnl must be a number" });
    }

    if (deltaTrades !== undefined && typeof deltaTrades !== "number") {
      return res.status(400).json({ message: "deltaTrades must be a number" });
    }

    // 3) Build increment object for Account
    const incObj = {
      currentBalance: pnl,
      totalTrades: deltaTrades ?? 0,
    };

    // 4) Update the Account, not the User
    const updatedAccount = await Account.findByIdAndUpdate(
      user.activeAccountId,
      { $inc: incObj },
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({
        message: "Active account not found for this user",
      });
    }

    return res.status(200).json({
      message: "Account updated successfully",
      account: updatedAccount,
    });
  } catch (error) {
    console.error("updateAccount error:", error);
    return res.status(500).json({
      message: "server error: failed to update account",
      error: error.message || "Unknown error",
    });
  }
};


module.exports = {
  createAccount,
  getAccounts,
  getAcitveAccount,
  updateAccount,
};
