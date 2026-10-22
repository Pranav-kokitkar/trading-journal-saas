const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const upload = require("../middleware/upload-middleware");
const { PLAN_LIMITS } = require("../config/planLimits");
const {
  AddTrade,
  getAllTrades,
  getTradeByID,
  closeTradeByID,
  deleteTradeById,
  restoreTradeById,
  undoTradeById,
  updateTradeNotesById,
  updateTradeTagsById,
  updateTradeScreenshots,
  deleteTradeScreenshot,
} = require("../controllers/trade-controller");
const {
  importTradesController,
} = require("../controllers/import-trades-controller");
const router = express.Router();

router
  .route("/import")
  .post(authMiddleware, upload.single("file"), importTradesController);

router
  .route("/")
  .post(
    authMiddleware,
    upload.array("screenshots", PLAN_LIMITS.PRO.MAX_SCREENSHOTS),
    AddTrade,
  )
  .get(authMiddleware, getAllTrades);

router
  .route("/:id")
  .get(authMiddleware, getTradeByID)
  .patch(authMiddleware, closeTradeByID)
  .delete(authMiddleware, deleteTradeById);

router.route("/:id/restore").post(authMiddleware, restoreTradeById);
router.route("/:id/undo").post(authMiddleware, undoTradeById);

router.route("/:id/note").patch(authMiddleware, updateTradeNotesById);
router.route("/:id/tags").patch(authMiddleware, updateTradeTagsById);
router
  .route("/:id/screenshots")
  .patch(
    authMiddleware,
    upload.array("screenshots", PLAN_LIMITS.PRO.MAX_SCREENSHOTS),
    updateTradeScreenshots,
  );
router.route("/:id/screenshot").delete(authMiddleware, deleteTradeScreenshot);

module.exports = router;
