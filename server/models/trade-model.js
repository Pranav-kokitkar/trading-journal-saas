const mongoose = require("mongoose");

const exitedPriceSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  volume: { type: Number, required: true },
});

const exitTimestampSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  volume: { type: Number, required: true },
  timestamp: { type: Date, required: true },
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
  riskType: {
    type: String,
    enum: ["dollar", "percent", "lots"],
    default: "dollar",
  },
  exitedPrice: { type: [exitedPriceSchema], default: [] },

  rr: { type: Number, default: 0 },
  pnl: { type: Number, default: 0 },
  slippage: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  tradeResult: { type: String, default: "" },
  riskAmount: { type: Number, default: 0 },
  riskPercent: { type: Number, default: 0 },
  isImported: { type: Boolean, default: false },
  balanceAfterTrade: { type: Number, default: 0 },
  tradeNumber: { type: Number, default: 0 },

  dateTime: { type: Date, required: true },
  tradeNotes: { type: String, default: "" },
  tradeStatus: { type: String, default: "" },
  session: { type: String, default: "" },
  confidence: { type: Number, default: 50, min: 0, max: 100 },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tags",
    },
  ],
  strategy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Strategy",
  },
  screenshots: {
    type: [String],
    default: [],
  },
  entryTime: { type: Date, required: true },
  exitTime: { type: Date },
  durationMinutes: { type: Number, default: 0 },
  durationHours: { type: Number, default: 0 },
  durationText: { type: String, default: "" },
  exitTimestamps: { type: [exitTimestampSchema], default: [] },
});

// ✅ CRITICAL INDEXES for query performance
tradeSchema.index({ userId: 1, accountId: 1, dateTime: -1 }); // Main query pattern
tradeSchema.index({ userId: 1, tradeStatus: 1 }); // Filter by status
tradeSchema.index({ userId: 1, symbol: 1 }); // Search by symbol
tradeSchema.index({ userId: 1, tradeResult: 1 }); // Filter by result
tradeSchema.index({ dateTime: -1 }); // Sorting
tradeSchema.index({ userId: 1, accountId: 1, isImported: 1, dateTime: -1 });
tradeSchema.index({
  userId: 1,
  strategy: 1,
  tradeStatus: 1,
  accountId: 1,
  dateTime: -1,
});
tradeSchema.index({ userId: 1, session: 1, accountId: 1, dateTime: -1 }); // Session analytics

const Trade = new mongoose.model("Trade", tradeSchema);

module.exports = Trade;
