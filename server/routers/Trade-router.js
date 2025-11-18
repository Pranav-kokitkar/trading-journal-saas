const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  AddTrade,
  getAllTrades,
  getTradeByID,
} = require("../controllers/trade-controller");
const router = express.Router();

router
  .route("/")
  .post(authMiddleware, AddTrade)
  .get(authMiddleware, getAllTrades);

router.route("/:id").get(authMiddleware, getTradeByID);

module.exports = router;
