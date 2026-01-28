const mongoose = require("mongoose");
const { Schema } = mongoose;

const accountSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    initialCapital: { type: Number, required: true },
    currentBalance: {
      type: Number,
      required: true,
      default: function () {
        return this.initialCapital;
      },
    },
    totalTrades: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "archived", "disabled"],
      default: "active",
    },
  },
  { timestamps: true },
);

// ✅ INDEXES for performance
accountSchema.index({ userId: 1, status: 1 }); // Filter by user and status
accountSchema.index({ userId: 1, createdAt: -1 }); // Sort by creation date

const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
