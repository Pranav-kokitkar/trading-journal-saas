const jwt = require("jsonwebtoken");
const User = require("../models/user-model");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res
      .status(400)
      .json({ message: "Unauthorized: Token not provided" });
  }

  const jwttoken = token.replace("Bearer", "").trim();

  try {
    const isVerified = jwt.verify(jwttoken, process.env.JWT_SECRETE_KEY);

    const userData = await User.findOne({ email: isVerified.email }).select(
      "-password"
    );
    req.user = userData;
    req.token = jwttoken;
    req.userID = userData._id;
    req.isAdmin = userData.isAdmin;
    next();
  } catch (error) {
    return res.status(400).json({ message: "Unauthorized token" });
  }
};

module.exports = authMiddleware;
