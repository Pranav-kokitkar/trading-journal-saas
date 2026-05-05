const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const { queryAudit } = require("../controllers/audit-controller");
const router = express.Router();

// Admins only — authMiddleware sets req.user
router.get("/", authMiddleware, queryAudit);

module.exports = router;
