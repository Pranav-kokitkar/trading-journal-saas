const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  getUser,
  updateUser,
  setActiveAccount,
} = require("../controllers/user-controller");
const router = express.Router();

router
  .route("/")
  .get(authMiddleware, getUser)
  .patch(authMiddleware, updateUser);

router.patch("/active-account", authMiddleware, setActiveAccount);

module.exports = router;
