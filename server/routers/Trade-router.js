const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  AddTrade,
  getAllTrades,
  getTradeByID,
  closeTradeByID,
  deleteTradeById,
} = require("../controllers/trade-controller");
const router = express.Router();

router
  .route("/")
  .post(authMiddleware, AddTrade)
  .get(authMiddleware, getAllTrades);

router.route("/:id").get(authMiddleware, getTradeByID);
router.route("/:id/close").patch(authMiddleware, closeTradeByID);
router.route("/delete/:id").delete(authMiddleware, deleteTradeById);

module.exports = router;
