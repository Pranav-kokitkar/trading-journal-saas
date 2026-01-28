const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  createStrategy,
  getAllStrategies,
  updateStrategy,
  deleteStrategy,
} = require("../controllers/Strategy-controller");
const router = express.Router();

router
  .route("/")
  .post(authMiddleware, createStrategy)
  .get(authMiddleware, getAllStrategies);

router
  .route("/:id")
  .patch(authMiddleware, updateStrategy)
  .delete(authMiddleware, deleteStrategy);

module.exports = router;
