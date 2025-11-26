const mongoose = require("mongoose");
const { Schema } = mongoose;

const contactSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  subject: { type: String, required: true, maxLength: 100 },
  message: { type: String, required: true },
});

const Contact = mongoose.model("contact", contactSchema);

module.exports = Contact;
