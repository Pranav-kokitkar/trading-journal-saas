const jwt = require("jsonwebtoken");

const getJwtSecret = () =>
  process.env.JWT_SECRET_KEY || process.env.JWT_SECRETE_KEY;

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token not provided" });
  }

  const jwttoken = token.replace("Bearer", "").trim();

  try {
    const jwtSecret = getJwtSecret();

    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    const decoded = jwt.verify(jwttoken, jwtSecret);

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
