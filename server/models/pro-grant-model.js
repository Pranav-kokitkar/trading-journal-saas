const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    action: { type: String, enum: ["grant", "revoke"], required: true },
    reason: { type: String, required: true },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const proGrantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    duration: { type: String, enum: ["lifetime", "temporary"], required: true },
    expiresAt: { type: Date, default: null },
    reason: {
      type: String,
      enum: ["founder_owner", "friend", "beta_promotional"],
      required: true,
    },
    note: { type: String, trim: true, maxlength: 500 },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    revokedAt: { type: Date, default: null },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true },
);

proGrantSchema.index({ userId: 1, revokedAt: 1 });
proGrantSchema.index({ "history.timestamp": -1 });

const ProGrant = mongoose.model("ProGrant", proGrantSchema);

module.exports = ProGrant;
