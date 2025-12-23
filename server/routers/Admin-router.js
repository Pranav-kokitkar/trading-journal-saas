const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const adminMiddleware = require("../middleware/admin-middleware");
const {
  getAllUsers,
  updateUser,
  deleteUser,
  getUserByID,
} = require("../controllers/admin/adminUser-controller");
const {
  getAllContacts,
  deleteContactByID,
  updateContactStatus,
} = require("../controllers/admin/adminContact-controller");
const {
  getAllAccounts,
  getAccountByID,
  editAccountDetails,
  getTradesByAccountId,
  getAccountPerformance,
} = require("../controllers/admin/adminAccount-controller");
const {
  getAllTrades,
  getTradeByID,
} = require("../controllers/admin/adminTrades-controller");
const { getStats } = require("../controllers/admin/adminDashboard-controller");
const router = express.Router();

//====== USERS =====
router.route("/users").get(authMiddleware, adminMiddleware, getAllUsers);
router
  .route("/users/:id")
  .patch(authMiddleware, adminMiddleware, updateUser)
  .delete(authMiddleware, adminMiddleware, deleteUser)
  .get(authMiddleware, adminMiddleware, getUserByID);

//====== CONTACTS =====
router.route("/contact").get(authMiddleware, adminMiddleware, getAllContacts);

router
  .route("/contact/:id")
  .delete(authMiddleware, adminMiddleware, deleteContactByID)
  .patch(authMiddleware, adminMiddleware, updateContactStatus);

//====== ACCOUNTS =====
router.route("/account").get(authMiddleware, adminMiddleware, getAllAccounts);
router
  .route("/account/:id")
  .get(authMiddleware, adminMiddleware, getAccountByID)
  .patch(authMiddleware, adminMiddleware, editAccountDetails);
router
  .route("/account/performance/:id")
  .get(authMiddleware, adminMiddleware, getAccountPerformance);
router
  .route("/account/trades/:id")
  .get(authMiddleware, adminMiddleware, getTradesByAccountId);

//====== TRADES =====
router.route("/trades").get(authMiddleware, adminMiddleware, getAllTrades);
router.route("/trades/:id").get(authMiddleware, adminMiddleware, getTradeByID);

//====== DASHBOARD =====
router.route("/dashboard").get(authMiddleware, adminMiddleware, getStats);

module.exports = router;
