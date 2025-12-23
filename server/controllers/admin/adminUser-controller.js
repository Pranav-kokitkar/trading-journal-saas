const User = require("../../models/user-model");
const Account = require("../../models/account-model");
const mongoose = require("mongoose");

const getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const role = req.query.role || "all"; // Add role filter

    // Build search filter
    let filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Role filter
    if (role === "admin") {
      filter.isAdmin = true;
    } else if (role === "user") {
      filter.isAdmin = false;
    }
    // if role === 'all', don't add any filter

    // Fetch users with filters
    const users = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .select("-password");

    // Get counts with filter applied
    const totalUsers = await User.countDocuments(filter);
    const adminUsers = await User.countDocuments({
      ...filter,
      isAdmin: true,
    });

    res.status(200).json({
      users,
      stats: {
        totalUsers,
        adminUsers,
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
      search: search || null,
      role: role,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "server error to get all users", err: error.message });
  }
};

const getUserByID = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // 2. Fetch user with excluded fields
    const userDetails = await User.findById(id).select({
      password: 0,
      activeAccountId: 0,
      updatedAt: 0,
      __v: 0,
    });

    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Fetch user accounts (exclude internal fields)
    const userAccounts = await Account.find({ userId: id }).select({
      __v: 0,
      updatedAt: 0,
    });

    // 4. Send controlled response
    res.status(200).json({
      user: userDetails,
      accounts: userAccounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedUserDetails = req.body;
    const updatedUser = await User.updateOne(
      { _id: id },
      { $set: updatedUserDetails }
    );
    res
      .status(200)
      .json({ message: "user detasils updated", updaed: updatedUser });
  } catch (error) {
    res.status(400).json({ message: "failed to update user", err: error });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    await User.deleteOne({ _id: id });
    res.status(200).json({ message: "delete success" });
  } catch (error) {
    res.status(400).json({ message: "error while deleting user", err: error });
  }
};

module.exports = { getAllUsers, updateUser, deleteUser, getUserByID };
