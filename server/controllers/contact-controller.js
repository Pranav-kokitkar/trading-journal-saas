const Contact = require("../models/contact-model");
const cloudinary = require("../config/cloudinary"); // ⬅️ make sure this file exists as we discussed

const contactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ message: "name, email and message are required" });
    }

    let screenshotUrl = "";

    // If file sent from frontend under "screenshot"
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "trading-journal/issues", // optional folder in Cloudinary
          },
          (error, uploadResult) => {
            if (error) return reject(error);
            resolve(uploadResult);
          }
        );

        uploadStream.end(req.file.buffer);
      });

      screenshotUrl = result.secure_url; // full HTTPS URL
    }

    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
      screenshotUrl, 
    });

    res.status(200).json({
      message: "submitted",
      contact,
    });
  } catch (error) {
    console.error("CONTACT ERROR:", error);
    return res.status(500).json({
      message: "Failed to submit contact form",
      error: error.message,
    });
  }
};

module.exports = { contactForm };
