const express = require("express");
const { Register, Login, user } = require("../controllers/auth-controller");
const authMiddleware = require("../middleware/auth-middleware");
const router = express.Router();

router.route("/register").post(Register);
router.route("/login").post(Login);
router.route("/user").get(authMiddleware, user);

module.exports = router;
