const User = require("../models/user-model");
const Strategy = require("../models/strategy-model");

const createStrategy = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: "Strategy name is required" });
    }

    const user = await User.findById(userId).select(
      "plan planExpiresAt activeAccountId",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Get active accountId from user
    const accountId = user.activeAccountId;

    if (!accountId) {
      return res.status(400).json({
        message: "No active account selected",
      });
    }
    await Strategy.create({
      userId,
      accountId,
      name,
      description,
    });
    res.status(201).json({ message: "Strategy created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

const getAllStrategies = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("activeAccountId");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const accountId = user.activeAccountId;

    if (!accountId) {
      return res.status(400).json({
        message: "No active account selected",
      });
    }

    const strategies = await Strategy.find({
      userId,
      accountId,
      $or: [{ status: { $exists: false } }, { status: { $ne: "archived" } }],
    }).sort({ createdAt: -1 });
    res.status(200).json(strategies);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

const updateStrategy = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
    const userId = req.user.id;
    const strategy = await Strategy.findOne({ _id: id });
    const user = await User.findById(userId).select("activeAccountId");
    const accountId = user.activeAccountId;

    if (!strategy) {
      return res.status(404).json({ message: "Strategy not found" });
    }

    if (strategy.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (strategy.accountId.toString() !== user.activeAccountId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    await Strategy.findByIdAndUpdate({ _id: id }, { $set: updatedData });
    res.status(200).json({ message: "Strategy updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteStrategy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId).select("activeAccountId");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const strategy = await Strategy.findById(id);
    if (!strategy) {
      return res.status(404).json({ message: "Strategy not found" });
    }

    if (strategy.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (strategy.accountId.toString() !== user.activeAccountId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Strategy.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Strategy deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createStrategy,
  getAllStrategies,
  updateStrategy,
  deleteStrategy,
};
