const express = require("express");
const {
  createOrder,
  verifyPayment,
} = require("../controllers/payment-controller");
const authMiddleware = require("../middleware/auth-middleware");
const router = express.Router();

router.route("/create-order").post(authMiddleware, createOrder);

router.route("/verify").post(authMiddleware, verifyPayment);

module.exports = router;
