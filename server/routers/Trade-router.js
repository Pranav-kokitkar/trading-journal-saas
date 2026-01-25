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
  updateTradeTagsById,
  updateTradeScreenshots,
  deleteTradeScreenshot,
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
router.route("/:id/tags").patch(authMiddleware, updateTradeTagsById);
router
  .route("/:id/screenshots")
  .patch(
    authMiddleware,
    upload.array("screenshots", 3),
    updateTradeScreenshots,
  );
router.route("/:id/screenshot").delete(authMiddleware, deleteTradeScreenshot);

module.exports = router;
