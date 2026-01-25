const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const {
  createTag,
  deleteTag,
  updateTag,
  getAllTag,
} = require("../controllers/tags-controller");

const router = express.Router();

router
  .route("/")
  .get(authMiddleware, getAllTag)
  .post(authMiddleware, createTag);

router
  .route("/:id")
  .delete(authMiddleware, deleteTag)
  .patch(authMiddleware, updateTag);

module.exports = router;
