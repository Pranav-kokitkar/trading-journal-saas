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
  },
  { timestamps: true }
);

const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
