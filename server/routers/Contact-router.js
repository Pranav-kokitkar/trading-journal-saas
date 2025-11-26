const express = require("express");
const { contactForm } = require("../controllers/contact-controller");
const router = express.Router();

router.post("/", contactForm);

module.exports = router;
