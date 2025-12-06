const mongoose = require("mongoose");

const exitedPriceSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  volume: { type: Number, required: true },
});

const tradeSchema = new mongoose.Schema({
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
  marketType: { type: String, required: true },
  symbol: { type: String, required: true },
  tradeDirection: { type: String, required: true },
  entryPrice: { type: Number, required: true },
  stoplossPrice: { type: Number, required: true },
  takeProfitPrice: { type: Number },
  riskType: { type: String },
  exitedPrice: { type: [exitedPriceSchema], default: [] },

  rr: { type: Number, default: 0 },
  pnl: { type: Number, default: 0 },
  tradeResult: { type: String, default: "" },
  riskAmount: { type: Number, default: 0 },
  riskPercent: { type: Number, default: 0 },
  balanceAfterTrade: { type: Number, default: 0 },
  tradeNumber: { type: Number, default: 0 },

  dateTime: { type: Date, required: true },
  tradeNotes: { type: String, default: "" },
  tradeStatus: { type: String, default: "" },
  screenshots: {
    type: [String],
    default: [],
  },
});

const Trade = new mongoose.model("Trade", tradeSchema);

module.exports = Trade;
