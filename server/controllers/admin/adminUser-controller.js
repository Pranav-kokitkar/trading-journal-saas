const User = require("../../models/user-model");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res
      .status(400)
      .json({ message: "server error to get all users", err: error });
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
