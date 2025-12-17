const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const adminMiddleware = require("../middleware/admin-middleware");
const {
  getAllUsers,
  updateUser,
  deleteUser,
} = require("../controllers/admin/adminUser-controller");
const {
  getAllContacts,

  deleteContactByID,
} = require("../controllers/admin/adminContact-controller");
const { getAllAccounts,   getAccountByID,editAccountDetails,getTradesByAccountId } = require("../controllers/admin/adminAccount-controller");
const router = express.Router();


//====== USERS =====
router.route("/users").get(authMiddleware, adminMiddleware, getAllUsers);
router
  .route("/users/:id")
  .patch(authMiddleware, adminMiddleware, updateUser)
  .delete(authMiddleware, adminMiddleware, deleteUser);


//====== CONTACTS =====
router.route("/contact").get(authMiddleware, adminMiddleware, getAllContacts);
router
  .route("/contact/:id")
  .delete(authMiddleware, adminMiddleware, deleteContactByID);


//====== ACCOUNTS =====
router.route("/account").get(authMiddleware, adminMiddleware, getAllAccounts)
router.route("/account/:id").get(authMiddleware, adminMiddleware, getAccountByID).patch(authMiddleware, adminMiddleware, editAccountDetails)
router.route("/account/:id/trades").get(authMiddleware, adminMiddleware, getTradesByAccountId)

module.exports = router;
