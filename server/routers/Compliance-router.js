const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const controller = require("../controllers/compliance-controller");

const router = express.Router();
router.use(authMiddleware);
router.get("/rules", controller.listRules);
router.post("/rules", controller.createRule);
router.patch("/rules/:id", controller.updateRule);
router.delete("/rules/:id", controller.deleteRule);
router.get("/trades/:tradeId", controller.getTradeCompliance);
router.post("/trades/:tradeId/re-evaluate", controller.reevaluateTrade);
router.get("/summary", controller.getSummary);

module.exports = router;
