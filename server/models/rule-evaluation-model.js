const mongoose = require("mongoose");

const ruleEvaluationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    tradeId: { type: mongoose.Schema.Types.ObjectId, ref: "Trade", required: true },
    ruleId: { type: mongoose.Schema.Types.ObjectId, ref: "TradingRule", required: true },
    revision: { type: String, required: true },
    status: { type: String, enum: ["pass", "violation", "not_evaluable"], required: true },
    ruleSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    actual: { type: mongoose.Schema.Types.Mixed, default: null },
    expected: { type: mongoose.Schema.Types.Mixed, default: null },
    message: { type: String, required: true },
    evaluatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ruleEvaluationSchema.index({ userId: 1, accountId: 1, tradeId: 1, evaluatedAt: -1 });
ruleEvaluationSchema.index({ ruleId: 1, tradeId: 1, revision: 1 }, { unique: true });

module.exports = mongoose.model("RuleEvaluation", ruleEvaluationSchema);
