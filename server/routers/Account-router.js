const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  createAccount,
  getAccounts,
  getAcitveAccount,
  updateAccount,
  deleteAccountByID,
} = require("../controllers/account-controller");
const router = express.Router();

router
  .route("/")
  .post(authMiddleware, createAccount)
  .get(authMiddleware, getAccounts)
  .patch(authMiddleware, updateAccount);

router.route("/:id").delete(authMiddleware, deleteAccountByID);

router.route("/active-account").get(authMiddleware, getAcitveAccount);

module.exports = router;
