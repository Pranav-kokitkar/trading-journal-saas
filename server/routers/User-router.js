const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const { getUser, updateUser } = require("../controllers/user-controller");
const router = express.Router();

router
  .route("/")
  .get(authMiddleware, getUser)
  .patch(authMiddleware, updateUser);

module.exports = router;
