const Contact = require("../models/contact-model");

const contactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    await Contact.create({ name, email, subject, message });
    res.status(200).json({ message: "submitted" });
  } catch (error) {
    console.log("CONTACT ERROR:", error);
    return res.status(400).json({
      message: "error from server while submitting contact",
      error: error.message,
    });
  }
};

module.exports = { contactForm };
