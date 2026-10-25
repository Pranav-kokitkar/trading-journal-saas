const mongoose = require("mongoose");
const User = require("../models/user-model");
const Account = require("../models/account-model");
const Strategy = require("../models/strategy-model");
const TradingRule = require("../models/trading-rule-model");
const { getMaxActiveRules } = require("../config/planLimits");
const { hasEffectiveProAccess } = require("../services/pro-access-service");
const RuleEvaluation = require("../models/rule-evaluation-model");
const {
  RULE_TYPES,
  evaluateTradeCompliance,
  evaluateAccountCompliance,
} = require("../services/compliance-service");

const ruleTypesByCategory = {
  risk_management: ["max_risk_percent", "max_daily_loss", "max_trades_per_day", "required_stop_loss", "min_rr"],
  strategy_execution: ["allowed_directions", "allowed_sessions"],
};

const getUserId = (req) => req.userID || req.user?._id;
const validId = (value) => mongoose.Types.ObjectId.isValid(value);
const activeRuleLocks = new Map();

const withActiveRuleLock = async (userId, callback) => {
  const previous = activeRuleLocks.get(String(userId)) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const queued = previous.then(() => current);
  activeRuleLocks.set(String(userId), queued);
  await previous;
  try {
    return await callback();
  } finally {
    release();
    if (activeRuleLocks.get(String(userId)) === queued) {
      activeRuleLocks.delete(String(userId));
    }
  }
};

const validateRuleInput = async (body, userId, existing = null) => {
  const accountId = body.accountId || existing?.accountId;
  const strategyId = body.strategyId === "" ? null : (body.strategyId ?? existing?.strategyId ?? null);
  const category = body.category || existing?.category;
  const ruleType = body.ruleType || existing?.ruleType;
  if (!validId(accountId)) throw new Error("Valid accountId is required");
  if (!await Account.exists({ _id: accountId, userId, deleted: { $ne: true } })) throw new Error("Account not found");
  if (!ruleTypesByCategory[category]?.includes(ruleType) || !RULE_TYPES.has(ruleType)) throw new Error("Unsupported rule type for category");
  if (strategyId && (!validId(strategyId) || !await Strategy.exists({ _id: strategyId, accountId, userId, deleted: { $ne: true } }))) {
    throw new Error("Strategy does not belong to this account");
  }
  if (!body.name && !existing?.name) throw new Error("Rule name is required");
  return { accountId, strategyId, category, ruleType };
};

const listRules = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { accountId, category, strategyId, enabled, severity, search } = req.query;
    if (!validId(accountId)) return res.status(400).json({ message: "Valid accountId is required" });
    const query = { userId, accountId };
    if (category) query.category = category;
    if (strategyId) query.strategyId = strategyId === "global" ? null : strategyId;
    if (enabled !== undefined) query.enabled = enabled === "true";
    if (severity) query.severity = severity;
    if (search?.trim()) query.name = { $regex: search.trim(), $options: "i" };
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const [rules, total] = await Promise.all([
      TradingRule.find(query)
        .populate("strategyId", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TradingRule.countDocuments(query),
    ]);
    return res.json({ rules, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch trading rules" });
  }
};

const createRule = async (req, res) => {
  try {
    const userId = getUserId(req);
    const scope = await validateRuleInput(req.body, userId);
    const rule = await withActiveRuleLock(userId, async () => {
      const user = await User.findById(userId).select("plan planExpiresAt");
      const isPro = await hasEffectiveProAccess(user);
      const maxActiveRules = getMaxActiveRules(isPro);
      const activeRuleCount = await TradingRule.countDocuments({
        userId,
        enabled: true,
      });
      if (activeRuleCount >= maxActiveRules && req.body.enabled !== false) {
        const error = new Error(
          `Free plan active trading rule limit (${maxActiveRules}) reached. Upgrade to Pro.`,
        );
        error.code = "ACTIVE_RULE_LIMIT_REACHED";
        throw error;
      }
      return TradingRule.create({ ...req.body, ...scope, userId });
    });
    await evaluateAccountCompliance({ userId, accountId: rule.accountId });
    return res.status(201).json(rule);
  } catch (error) {
    return res.status(error.code === "ACTIVE_RULE_LIMIT_REACHED" ? 403 : 400).json({
      message: error.message,
      ...(error.code ? { code: error.code } : {}),
    });
  }
};

const updateRule = async (req, res) => {
  try {
    const userId = getUserId(req);
    const rule = await TradingRule.findOne({ _id: req.params.id, userId });
    if (!rule) return res.status(404).json({ message: "Rule not found" });
    const scope = await validateRuleInput({ ...rule.toObject(), ...req.body }, userId, rule);
    await withActiveRuleLock(userId, async () => {
      if (req.body.enabled === true && rule.enabled !== true) {
        const user = await User.findById(userId).select("plan planExpiresAt");
        const isPro = await hasEffectiveProAccess(user);
        const maxActiveRules = getMaxActiveRules(isPro);
        const activeRuleCount = await TradingRule.countDocuments({
          userId,
          enabled: true,
          _id: { $ne: rule._id },
        });
        if (activeRuleCount >= maxActiveRules) {
          const error = new Error(
            `Free plan active trading rule limit (${maxActiveRules}) reached. Upgrade to Pro.`,
          );
          error.code = "ACTIVE_RULE_LIMIT_REACHED";
          throw error;
        }
      }
      Object.assign(rule, req.body, scope);
      await rule.save();
    });
    await evaluateAccountCompliance({ userId, accountId: rule.accountId });
    return res.json(rule);
  } catch (error) {
    return res.status(error.code === "ACTIVE_RULE_LIMIT_REACHED" ? 403 : 400).json({
      message: error.message,
      ...(error.code ? { code: error.code } : {}),
    });
  }
};

const deleteRule = async (req, res) => {
  const rule = await TradingRule.findOneAndDelete(
    { _id: req.params.id, userId: getUserId(req) },
  );
  if (!rule) return res.status(404).json({ message: "Rule not found" });
  await evaluateAccountCompliance({ userId: getUserId(req), accountId: rule.accountId });
  return res.json({ message: "Rule deleted", rule });
};

const getTradeCompliance = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!validId(req.params.tradeId)) return res.status(400).json({ message: "Invalid trade id" });
    return res.json(await RuleEvaluation.find({ userId, tradeId: req.params.tradeId }).sort({ evaluatedAt: -1 }).lean());
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch compliance results" });
  }
};

const reevaluateTrade = async (req, res) => {
  try {
    return res.json({ evaluations: await evaluateTradeCompliance({ userId: getUserId(req), tradeId: req.params.tradeId }) });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getSummary = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!validId(userId)) return res.status(401).json({ message: "Unauthorized" });
    const query = { userId: new mongoose.Types.ObjectId(userId) };
    if (req.query.accountId && validId(req.query.accountId)) {
      query.accountId = new mongoose.Types.ObjectId(req.query.accountId);
    }
    const latestEvaluations = [
      { $match: query },
      { $sort: { evaluatedAt: -1 } },
      { $group: { _id: { tradeId: "$tradeId", ruleId: "$ruleId" }, evaluation: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$evaluation" } },
      { $lookup: { from: "tradingrules", localField: "ruleId", foreignField: "_id", as: "rule" } },
      { $unwind: { path: "$rule", preserveNullAndEmptyArrays: true } },
      { $match: { $or: [{ "rule.enabled": true }, { rule: { $exists: false } }] } },
      { $lookup: { from: "trades", localField: "tradeId", foreignField: "_id", as: "trade" } },
      { $unwind: "$trade" },
      { $match: { "trade.deleted": { $ne: true } } },
    ];
    const violationMatch = { status: "violation" };
    if (req.query.ruleId && validId(req.query.ruleId)) {
      violationMatch.ruleId = new mongoose.Types.ObjectId(req.query.ruleId);
    }
    if (req.query.fromDate || req.query.toDate) {
      violationMatch.evaluatedAt = {};
      if (req.query.fromDate) violationMatch.evaluatedAt.$gte = new Date(req.query.fromDate);
      if (req.query.toDate) violationMatch.evaluatedAt.$lt = new Date(req.query.toDate);
    }
    const page = Math.max(1, Number.parseInt(req.query.violationPage, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.violationLimit, 10) || 10));
    const violationPipeline = [
      ...latestEvaluations,
      { $match: violationMatch },
      { $lookup: { from: "tradingrules", localField: "ruleId", foreignField: "_id", as: "ruleDetails" } },
      { $unwind: { path: "$ruleDetails", preserveNullAndEmptyArrays: true } },
    ];
    if (req.query.severity) violationPipeline.push({ $match: { "ruleDetails.severity": req.query.severity } });
    if (req.query.search?.trim()) violationPipeline.push({ $match: { "ruleDetails.name": { $regex: req.query.search.trim(), $options: "i" } } });
    const [counts, violations, topRules] = await Promise.all([
      RuleEvaluation.aggregate([...latestEvaluations, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      RuleEvaluation.aggregate([
        ...violationPipeline,
        { $sort: { evaluatedAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { _id: 1, tradeId: { $toString: "$tradeId" }, status: 1, actual: 1, expected: 1, message: 1, evaluatedAt: 1, ruleId: { _id: "$ruleDetails._id", name: "$ruleDetails.name", severity: "$ruleDetails.severity" } } },
      ]),
      RuleEvaluation.aggregate([
        ...latestEvaluations,
        { $match: { status: "violation" } },
        { $group: { _id: "$ruleId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "tradingrules", localField: "_id", foreignField: "_id", as: "rule" } },
        { $unwind: { path: "$rule", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, ruleId: "$_id", count: 1, rule: { name: 1, severity: 1 } } },
      ]),
    ]);
    const violationCount = await RuleEvaluation.aggregate([
      ...violationPipeline,
      { $count: "total" },
    ]);
    const countMap = counts.reduce((map, item) => ({ ...map, [item._id]: item.count }), {});
    const evaluated = (countMap.pass || 0) + (countMap.violation || 0);
    return res.json({
      counts: countMap,
      complianceRate: evaluated ? Number(((countMap.pass || 0) / evaluated * 100).toFixed(1)) : null,
      violations,
      violationPagination: { total: violationCount[0]?.total || 0, page, limit, totalPages: Math.max(1, Math.ceil((violationCount[0]?.total || 0) / limit)) },
      topRules,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch compliance summary" });
  }
};

module.exports = { listRules, createRule, updateRule, deleteRule, getTradeCompliance, reevaluateTrade, getSummary };
