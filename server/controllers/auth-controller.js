const User = require("../models/user-model");

const Register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "email already exists" });
    }
    const userCreated = await User.create({ name, email, password });
    res.status(200).json({
      message: "user Created",
      token: await userCreated.generateToken(),
      userID: userCreated._id.toString(),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userExist = await User.findOne({ email });

    if (!userExist) {
      return res.status(400).json({ message: "user does not exist" });
    }

    const passwordMatch = await userExist.comparePassword(password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    res.status(200).json({
      message: "login sucess",
      token: await userExist.generateToken(),
      userID: userExist._id.toString(),
    });
  } catch (error) {
    res.status(400).json({ message: "error while login" });
  }
};

const user = async (req, res) => {
  try {
    const userData = req.user;
    return res.status(200).json({ userData });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { Register, Login, user };
