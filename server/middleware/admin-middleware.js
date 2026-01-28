const adminMiddleware = async (req, res, next) => {
  const isAdmin = req.isAdmin;
  if (isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Access denied, not an admin" });
  }
};
module.exports = adminMiddleware;
