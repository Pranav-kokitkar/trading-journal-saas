const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const TradingRule = require("../models/trading-rule-model");
const RuleEvaluation = require("../models/rule-evaluation-model");
const Trade = require("../models/trade-model");
const Account = require("../models/account-model");
const { getSummary, getTradeCompliance } = require("../controllers/compliance-controller");
const { evaluateTradeCompliance } = require("../services/compliance-service");

const mongoUri = process.env.COMPLIANCE_TEST_MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URI;
const canRun = Boolean(mongoUri);
const userId = new mongoose.Types.ObjectId();
const accountId = new mongoose.Types.ObjectId();
const otherAccountId = new mongoose.Types.ObjectId();

test("maximum risk evaluation persists violations, passes, missing data, isolation, and idempotency", { skip: !canRun }, async (t) => {
  await mongoose.connect(mongoUri);
  const rule = await TradingRule.create({
    userId,
    accountId,
    name: "Integration max risk",
    category: "risk_management",
    ruleType: "max_risk_percent",
    config: { maxPercent: 1 },
    enabled: true,
  });
  await Account.create([
    { _id: accountId, userId, name: "Compliance test account", initialCapital: 1000 },
    { _id: otherAccountId, userId, name: "Other compliance account", initialCapital: 1000 },
  ]);

  t.after(async () => {
    await Promise.all([
      TradingRule.deleteMany({ _id: rule._id }),
      Trade.deleteMany({ userId }),
      RuleEvaluation.deleteMany({ userId }),
      Account.deleteMany({ userId }),
    ]);
    await mongoose.disconnect();
  });

  const createTrade = (riskPercent, riskAmount, tradeAccountId = accountId) => Trade.create({
    userId,
    accountId: tradeAccountId,
    marketType: "crypto",
    symbol: "TEST",
    tradeDirection: "long",
    entryPrice: 100,
    stoplossPrice: 99,
    riskPercent,
    riskAmount,
    dateTime: new Date(),
    entryTime: new Date(),
    tradeStatus: "live",
  });

  const violationTrade = await createTrade(2, 20);
  const violation = await evaluateTradeCompliance({ userId, tradeId: violationTrade._id });
  assert.equal(violation.find((item) => String(item.ruleId) === String(rule._id)).status, "violation");

  const passTrade = await createTrade(0.5, 5);
  const pass = await evaluateTradeCompliance({ userId, tradeId: passTrade._id });
  assert.equal(pass.find((item) => String(item.ruleId) === String(rule._id)).status, "pass");

  const boundaryTrade = await createTrade(1, 10);
  const boundary = await evaluateTradeCompliance({ userId, tradeId: boundaryTrade._id });
  assert.equal(boundary.find((item) => String(item.ruleId) === String(rule._id)).status, "pass");

  const missingTrade = await createTrade(null, 0);
  const missing = await evaluateTradeCompliance({ userId, tradeId: missingTrade._id });
  assert.equal(missing.find((item) => String(item.ruleId) === String(rule._id)).status, "not_evaluable");

  const isolatedTrade = await createTrade(2, 20, otherAccountId);
  assert.equal((await evaluateTradeCompliance({ userId, tradeId: isolatedTrade._id }).catch(() => [])).length, 0);

  await evaluateTradeCompliance({ userId, tradeId: violationTrade._id });
  assert.equal(
    await RuleEvaluation.countDocuments({ ruleId: rule._id, tradeId: violationTrade._id }),
    1,
  );

  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await getTradeCompliance(
    { userID: userId.toString(), params: { tradeId: violationTrade._id.toString() } },
    response,
  );
  assert.equal(response.body[0].status, "violation");

  const summaryResponse = { ...response, body: null };
  await getSummary(
    { userID: userId.toString(), query: { accountId: accountId.toString() } },
    summaryResponse,
  );
  assert.equal(summaryResponse.body.counts.violation, 1);
});

test("all other implemented rule types produce violations when their conditions fail", { skip: !canRun }, async (t) => {
  await mongoose.connect(mongoUri);
  const testUserId = new mongoose.Types.ObjectId();
  const testAccountId = new mongoose.Types.ObjectId();
  const ruleInputs = [
    ["max_daily_loss", { maxLoss: 10 }],
    ["max_trades_per_day", { maxTrades: 0 }],
    ["required_stop_loss", {}],
    ["min_rr", { minRatio: 2 }],
    ["allowed_directions", { directions: ["short"] }],
    ["allowed_sessions", { sessions: ["london"] }],
  ];
  const rules = await TradingRule.insertMany(ruleInputs.map(([ruleType, config]) => ({
    userId: testUserId,
    accountId: testAccountId,
    name: `Integration ${ruleType}`,
    category: ruleType.startsWith("allowed_") ? "strategy_execution" : "risk_management",
    ruleType,
    config,
  })));
  await Account.create({
    _id: testAccountId,
    userId: testUserId,
    name: "Rule type test account",
    initialCapital: 1000,
  });
  const trade = await Trade.create({
    userId: testUserId,
    accountId: testAccountId,
    marketType: "crypto",
    symbol: "TEST",
    tradeDirection: "long",
    entryPrice: 100,
    stoplossPrice: 0,
    riskPercent: 1,
    riskAmount: 10,
    pnl: -11,
    rr: 1,
    session: "new york",
    dateTime: new Date(),
    entryTime: new Date(),
    tradeStatus: "live",
  });

  t.after(async () => {
    await Promise.all([
      TradingRule.deleteMany({ userId: testUserId }),
      Trade.deleteMany({ userId: testUserId }),
      RuleEvaluation.deleteMany({ userId: testUserId }),
      Account.deleteMany({ userId: testUserId }),
    ]);
    await mongoose.disconnect();
  });

  const evaluations = await evaluateTradeCompliance({ userId: testUserId, tradeId: trade._id });
  for (const rule of rules) {
    const evaluation = evaluations.find((item) => String(item.ruleId) === String(rule._id));
    assert.equal(evaluation.status, "violation", rule.ruleType);
  }
});
