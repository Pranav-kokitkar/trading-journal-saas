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
  subject: { type: String, required: true },
  message: { type: String, required: true },
  screenshotUrl: { type: String },
  submittedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["open", "in_progress", "resolved"],
    default: "open",
  },
});

const Contact = mongoose.model("contact", contactSchema);

module.exports = Contact;
