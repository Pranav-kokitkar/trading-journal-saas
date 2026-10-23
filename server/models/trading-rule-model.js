const mongoose = require("mongoose");

const tradingRuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
    strategyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Strategy",
      default: null,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    category: {
      type: String,
      enum: ["risk_management", "strategy_execution"],
      required: true,
    },
    ruleType: {
      type: String,
      enum: [
        "max_risk_percent",
        "max_daily_loss",
        "max_trades_per_day",
        "required_stop_loss",
        "min_rr",
        "allowed_directions",
        "allowed_sessions",
      ],
      required: true,
    },
    config: { type: mongoose.Schema.Types.Mixed, required: true },
    enabled: { type: Boolean, default: true },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "warning",
    },
    enforcementMode: {
      type: String,
      enum: ["warning", "tracking"],
      default: "warning",
    },
    override: { type: Boolean, default: false },
  },
  { timestamps: true },
);

tradingRuleSchema.index({ userId: 1, accountId: 1, enabled: 1 });
tradingRuleSchema.index({ userId: 1, accountId: 1, strategyId: 1, ruleType: 1 });

module.exports = mongoose.model("TradingRule", tradingRuleSchema);
