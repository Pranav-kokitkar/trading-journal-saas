const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  createAccount,
  getAccounts,
  getAcitveAccount,
  updateAccount,
  deleteAccountByID,
  manualRecalculateAccount,
} = require("../controllers/account-controller");
const router = express.Router();

router
  .route("/")
  .post(authMiddleware, createAccount)
  .get(authMiddleware, getAccounts)
  .patch(authMiddleware, updateAccount);

router.route("/:id").delete(authMiddleware, deleteAccountByID);

router.route("/active-account").get(authMiddleware, getAcitveAccount);

// ✅ Manual recalculation endpoint (for fixing corrupted balances)
router.route("/:id/recalculate").post(authMiddleware, manualRecalculateAccount);

module.exports = router;
