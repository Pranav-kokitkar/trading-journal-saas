const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  getAccount,
  updateAccount,
} = require("../controllers/account-controller");
const router = express.Router();

router
  .route("/")
  .get(authMiddleware, getAccount)
  .patch(authMiddleware, updateAccount);

module.exports = router;
