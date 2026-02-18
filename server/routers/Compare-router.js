const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const { Compare } = require("../controllers/compare-controller");
const router = express.Router();

router.route("/").post(authMiddleware, Compare);

module.exports = router;
