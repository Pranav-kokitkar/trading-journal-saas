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
const router = express.Router();

router.route("/users").get(authMiddleware, adminMiddleware, getAllUsers);
router
  .route("/users/:id")
  .patch(authMiddleware, adminMiddleware, updateUser)
  .delete(authMiddleware, adminMiddleware, deleteUser);

router.route("/contact").get(authMiddleware, adminMiddleware, getAllContacts);
router
  .route("/contact/:id")
  .delete(authMiddleware, adminMiddleware, deleteContactByID);

module.exports = router;
