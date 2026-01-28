const mongoose = require("mongoose");

const strategySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["active", "archived"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});

const Strategy = new mongoose.model("Strategy", strategySchema);

module.exports = Strategy;
