const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  addNotes,
  getAllNotes,
  deleteNoteByID,
} = require("../controllers/notes-controller");
const router = express.Router();

router
  .route("/")
  .get(authMiddleware, getAllNotes)
  .post(authMiddleware, addNotes);
router.route("/:id").delete(authMiddleware, deleteNoteByID);

module.exports = router;
