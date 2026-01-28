const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token not provided" });
  }

  const jwttoken = token.replace("Bearer", "").trim();

  try {
    const decoded = jwt.verify(jwttoken, process.env.JWT_SECRETE_KEY);

    // ✅ PERFORMANCE: Use JWT payload directly instead of DB query
    // All needed data is already in the token (set in user-model.js)
    req.user = {
      _id: decoded.userId,
      id: decoded.userId, // For compatibility with controllers using req.user.id
      email: decoded.email,
      isAdmin: decoded.isAdmin,
    };
    req.token = jwttoken;
    req.userID = decoded.userId;
    req.isAdmin = decoded.isAdmin;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = authMiddleware;
