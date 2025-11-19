const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  addNotes,
  getAllNotes,
  deleteNoteByID,
} = require("../controllers/notes-controller");
const router = express.Router();

router.route("/").get(authMiddleware, getAllNotes);
router.route("/add").post(authMiddleware, addNotes);
router.route("/delete/:id").delete(authMiddleware, deleteNoteByID);

module.exports = router;
