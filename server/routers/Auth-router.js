const express = require("express");
const { Register, Login, user } = require("../controllers/auth-controller");
const authMiddleware = require("../middleware/auth-middleware");
const validate = require("../middleware/validate-middleware");
const { registerSchema, loginSchema } = require("../validators/auth-validator");
const router = express.Router();

router.route("/register").post(validate(registerSchema), Register);
router.route("/login").post(validate(loginSchema), Login);
router.route("/user").get(authMiddleware, user);

module.exports = router;
