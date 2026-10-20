const User = require("../models/user-model");

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.userID).select("isAdmin");
    if (user?.isAdmin === true) return next();
    return res.status(403).json({ message: "Access denied, not an admin" });
  } catch (error) {
    return res.status(403).json({ message: "Access denied, not an admin" });
  }
};
module.exports = adminMiddleware;
