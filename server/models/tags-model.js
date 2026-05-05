const mongoose = require("mongoose");
const { Schema } = mongoose;

const tagsSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    colour: {
      type: String,
    },
  },
  { timestamps: true },
);

// Soft-delete fields
tagsSchema.add({
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});

const Tags = new mongoose.model("Tags", tagsSchema);
module.exports = Tags;
