const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const { exportTrades } = require("../controllers/export-controller");

const router = express.Router();

router.get("/trades", authMiddleware, exportTrades);

module.exports = router;
