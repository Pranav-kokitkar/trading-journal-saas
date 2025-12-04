const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  createAccount,
  getAccounts,
} = require("../controllers/account-controller");
const router = express.Router();

router
  .route("/")
  .post(authMiddleware, createAccount)
  .get(authMiddleware, getAccounts);

module.exports = router;
