const adminMiddleware = async (req, res,next) => {
  const isAdmin = req.isAdmin;
  if (isAdmin) {
    next();
  } else {
    res.status(400).json({ message: "Acess denied, not an admin" });
  }
};
module.exports = adminMiddleware;
