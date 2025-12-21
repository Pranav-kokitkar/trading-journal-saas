const User = require("../../models/user-model");

const getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = (page - 1) * limit;

    const users = await User.find().skip(skip).limit(limit);
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ isAdmin: true });

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
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "server error to get all users", err: error.message });
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

module.exports = { getAllUsers, updateUser, deleteUser };
