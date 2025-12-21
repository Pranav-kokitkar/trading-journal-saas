const mongoose = require("mongoose");
const Account = require("../../models/account-model");
const Trade = require("../../models/trade-model");

const getAllAccounts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 2;
    const skip = (page - 1) * limit;

    const accounts = await Account.find().skip(skip).limit(limit);
    const totalAccounts = await Account.countDocuments();
    const activeAccounts = await Account.countDocuments({ status: "active" });
    const disabledAccounts = await Account.countDocuments({
      status: "disabled",
    });

    res.status(200).json({
      accounts,
      stats: {
        totalAccounts,
        activeAccounts,
        disabledAccounts,
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalAccounts / limit),
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while getting accounts",
    });
  }
};

const getAccountByID = async (req, res) => {
  try {
    const { id } = req.params;

    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }

    const accountDetails = await Account.findById(id);

    if (!accountDetails) {
      return res.status(404).json({ message: "Account does not exist" });
    }

    res.status(200).json(accountDetails);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get account",
      error: error.message,
    });
  }
};

const editAccountDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid account ID" });
    }

    const { name, status } = req.body;

    // build update object manually (WHITELIST)
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ message: "Invalid account name" });
      }
      updateData.name = name.trim();
    }

    if (status !== undefined) {
      const allowedStatus = ["active", "archived", "disabled"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Invalid account status" });
      }
      updateData.status = status;
    }

    // no valid fields provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    const updatedAccount = await Account.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json(updatedAccount);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update account details",
      error: error.message,
    });
  }
};

const getTradesByAccountId = async (req, res) => {
  try {
    const accountId = req.params.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: "Invalid Account Id" });
    }

    const Trades = await Trade.find({ accountId })
      .sort({ dateTime: -1 })
      .skip(skip)
      .limit(limit);
    const Totaltrades = await Trade.countDocuments({ accountId });

    res.status(200).json({
      Trades,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(Totaltrades / limit),
      },
    });
  } catch (err) {
    res.status(400).json({
      message: "error from backend whil getting tardes by account id",
      error: err.message,
    });
  }
};

module.exports = {
  getAllAccounts,
  getAccountByID,
  editAccountDetails,
  getTradesByAccountId,
};
