const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  getAnalyticsController,
} = require("../controllers/analytics-controller");

const router = express.Router();

router.route("/").get(authMiddleware, getAnalyticsController);

module.exports = router;
