const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const upload = require("../middleware/upload-middleware");
const {
  AddTrade,
  getAllTrades,
  getTradeByID,
  closeTradeByID,
  deleteTradeById,
  updateTradeNotesById,
} = require("../controllers/trade-controller");
const router = express.Router();

router
  .route("/")
  .post(authMiddleware, upload.array("screenshots", 2), AddTrade)
  .get(authMiddleware, getAllTrades);

router
  .route("/:id")
  .get(authMiddleware, getTradeByID)
  .patch(authMiddleware, closeTradeByID)
  .delete(authMiddleware, deleteTradeById);

router.route("/:id/note").patch(authMiddleware, updateTradeNotesById);

module.exports = router;
