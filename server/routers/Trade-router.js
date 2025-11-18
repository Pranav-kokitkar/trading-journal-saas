const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const { AddTrade } = require("../controllers/trade-controller");
const router = express.Router();

router.route("/").post(authMiddleware, AddTrade);

module.exports = router;
