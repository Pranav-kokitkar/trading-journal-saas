const express = require("express");
const { contactForm } = require("../controllers/contact-controller");
const router = express.Router();
const upload = require("../middleware/upload-middleware");

router.post("/", upload.single("screenshot"), contactForm);

module.exports = router;
