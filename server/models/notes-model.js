const mongoose = require("mongoose");
const { Schema } = mongoose; // Destructure Schema for clarity

const notesSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // references User
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, maxLength: 200 },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

const Notes = mongoose.model("Notes", notesSchema);

module.exports = Notes;
