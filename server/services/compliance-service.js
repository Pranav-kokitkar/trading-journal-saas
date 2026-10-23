const mongoose = require("mongoose");
const Account = require("../models/account-model");
const Strategy = require("../models/strategy-model");
const Trade = require("../models/trade-model");
const TradingRule = require("../models/trading-rule-model");
const RuleEvaluation = require("../models/rule-evaluation-model");
const isDevelopment = process.env.NODE_ENV !== "production";

const complianceDiagnostic = (event, details) => {
  if (isDevelopment) {
    console.info(`[compliance] ${event}`, details);
  }
};

const RULE_TYPES = new Set([
  "max_risk_percent",
  "max_daily_loss",
  "max_trades_per_day",
  "required_stop_loss",
  "min_rr",
  "allowed_directions",
  "allowed_sessions",
]);

const dayBounds = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const evaluateRule = async (rule, trade, account, dailyTrades) => {
  const config = rule.config || {};
  const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);
  const violation = (actual, expected, message) => ({ status: "violation", actual, expected, message });
  const pass = (actual, expected, message) => ({ status: "pass", actual, expected, message });
  const notEvaluable = (message) => ({ status: "not_evaluable", actual: null, expected: null, message });

  switch (rule.ruleType) {
    case "max_risk_percent": {
      const actual = number(trade.riskPercent);
      const expected = number(config.maxPercent);
      const riskAmount = number(trade.riskAmount);
      if (actual === null || riskAmount === null || riskAmount <= 0 || expected === null || expected < 0) {
        return notEvaluable("Risk percentage, risk amount, or rule limit is missing.");
      }
      return actual <= expected
        ? pass(actual, expected, `Risk ${actual}% is within the ${expected}% limit.`)
        : violation(actual, expected, `Risk ${actual}% exceeds the ${expected}% limit.`);
    }
    case "max_daily_loss": {
      const expected = number(config.maxLoss);
      if (expected === null || expected < 0) return notEvaluable("Daily loss limit is missing.");
      const loss = dailyTrades.reduce((sum, item) => sum + Math.min(0, number(item.pnl) || 0), 0);
      const actual = Math.abs(loss);
      return actual <= expected
        ? pass(actual, expected, `Daily loss ${actual} is within the ${expected} limit.`)
        : violation(actual, expected, `Daily loss ${actual} exceeds the ${expected} limit.`);
    }
    case "max_trades_per_day": {
      const expected = number(config.maxTrades);
      if (expected === null || expected < 0) return notEvaluable("Daily trade limit is missing.");
      const actual = dailyTrades.length;
      return actual <= expected
        ? pass(actual, expected, `${actual} trades is within the daily limit of ${expected}.`)
        : violation(actual, expected, `${actual} trades exceeds the daily limit of ${expected}.`);
    }
    case "required_stop_loss": {
      const actual = Number.isFinite(Number(trade.stoplossPrice)) && Number(trade.stoplossPrice) > 0;
      return actual ? pass(true, true, "A stop-loss is recorded.") : violation(false, true, "This trade has no valid stop-loss.");
    }
    case "min_rr": {
      const actual = number(trade.rr);
      const expected = number(config.minRatio);
      if (actual === null || expected === null || expected < 0) return notEvaluable("Risk-to-reward ratio or rule limit is missing.");
      return actual >= expected
        ? pass(actual, expected, `R:R ${actual} meets the ${expected} minimum.`)
        : violation(actual, expected, `R:R ${actual} is below the ${expected} minimum.`);
    }
    case "allowed_directions": {
      const expected = Array.isArray(config.directions) ? config.directions.map(String) : [];
      if (!expected.length || !trade.tradeDirection) return notEvaluable("Allowed directions or trade direction is missing.");
      return expected.includes(String(trade.tradeDirection).toLowerCase())
        ? pass(trade.tradeDirection, expected, "Trade direction is allowed.")
        : violation(trade.tradeDirection, expected, "Trade direction is not allowed.");
    }
    case "allowed_sessions": {
      const expected = Array.isArray(config.sessions) ? config.sessions.map(String) : [];
      if (!expected.length || !trade.session) return notEvaluable("Allowed sessions or trade session is missing.");
      return expected.includes(String(trade.session).toLowerCase())
        ? pass(trade.session, expected, "Trading session is allowed.")
        : violation(trade.session, expected, "Trading session is not allowed.");
    }
    default:
      return notEvaluable("This rule type is not supported.");
  }
};

const getApplicableRules = async ({ userId, accountId, strategyId }) => {
  const rules = await TradingRule.find({
    userId,
    accountId,
    enabled: true,
    $or: [{ strategyId: null }, ...(strategyId ? [{ strategyId }] : [])],
  }).lean();
  const strategyRules = rules.filter((rule) => rule.strategyId && String(rule.strategyId) === String(strategyId));
  const overriddenTypes = new Set(strategyRules.filter((rule) => rule.override).map((rule) => rule.ruleType));
  const applicableRules = rules.filter((rule) => rule.strategyId || !overriddenTypes.has(rule.ruleType));
  complianceDiagnostic("rules-resolved", {
    accountId: String(accountId),
    strategyId: strategyId ? String(strategyId) : null,
    enabledRuleCount: rules.length,
    applicableRuleCount: applicableRules.length,
  });
  return applicableRules;
};

const evaluateTradeCompliance = async ({ userId, tradeId }) => {
  if (!mongoose.Types.ObjectId.isValid(tradeId)) throw new Error("Invalid trade id");
  const trade = await Trade.findOne({ _id: tradeId, userId, deleted: { $ne: true } }).lean();
  if (!trade) throw new Error("Trade not found");
  const account = await Account.findOne({ _id: trade.accountId, userId }).lean();
  if (!account) throw new Error("Account not found");
  if (trade.strategy && !(await Strategy.exists({ _id: trade.strategy, accountId: trade.accountId, userId }))) {
    throw new Error("Trade strategy does not belong to its account");
  }

  const { start, end } = dayBounds(trade.entryTime || trade.dateTime);
  const dailyTrades = await Trade.find({
    userId,
    accountId: trade.accountId,
    deleted: { $ne: true },
    dateTime: { $gte: start, $lt: end },
  }).lean();
  const rules = await getApplicableRules({ userId, accountId: trade.accountId, strategyId: trade.strategy });
  complianceDiagnostic("trade-start", {
    tradeId: String(trade._id),
    accountId: String(trade.accountId),
    trigger: "evaluateTradeCompliance",
    riskPercent: trade.riskPercent,
    riskAmount: trade.riskAmount,
    ruleCount: rules.length,
  });
  const revision = `${String(trade.lastModifiedAt || trade.updatedAt || trade.createdAt || trade._id)}:${rules
    .map((rule) => `${rule._id}:${rule.updatedAt?.toISOString?.() || rule.updatedAt || ""}`)
    .join("|")}`;
  const evaluations = [];

  for (const rule of rules) {
    const result = await evaluateRule(rule, trade, account, dailyTrades);
    complianceDiagnostic("rule-result", {
      tradeId: String(trade._id),
      ruleId: String(rule._id),
      ruleType: rule.ruleType,
      actual: result.actual,
      expected: result.expected,
      status: result.status,
    });
    try {
      const evaluation = await RuleEvaluation.findOneAndUpdate(
        { ruleId: rule._id, tradeId: trade._id, revision },
        {
          userId,
          accountId: trade.accountId,
          ruleId: rule._id,
          tradeId: trade._id,
          revision,
          ...result,
          ruleSnapshot: rule,
          evaluatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean();
      complianceDiagnostic("evaluation-persisted", {
        tradeId: String(trade._id),
        ruleId: String(rule._id),
        evaluationId: String(evaluation._id),
      });
      evaluations.push(evaluation);
    } catch (error) {
      complianceDiagnostic("evaluation-persistence-failed", {
        tradeId: String(trade._id),
        ruleId: String(rule._id),
        error: error.message,
      });
      throw error;
    }
  }
  return evaluations;
};

const evaluateAccountCompliance = async ({ userId, accountId }) => {
  const trades = await Trade.find({
    userId,
    accountId,
    deleted: { $ne: true },
  }).select("_id").lean();

  for (const trade of trades) {
    await evaluateTradeCompliance({ userId, tradeId: trade._id });
  }
};

const reevaluateAffectedDay = async ({ userId, accountId, date }) => {
  const { start, end } = dayBounds(date);
  const trades = await Trade.find({
    userId,
    accountId,
    deleted: { $ne: true },
    dateTime: { $gte: start, $lt: end },
  }).select("_id").lean();

  for (const trade of trades) {
    await evaluateTradeCompliance({ userId, tradeId: trade._id });
  }
};

module.exports = {
  RULE_TYPES,
  evaluateTradeCompliance,
  evaluateAccountCompliance,
  reevaluateAffectedDay,
  getApplicableRules,
};
