const PLAN_LIMITS = {
  FREE: {
    MAX_TRADES: 100,
    MAX_SCREENSHOTS: 2,
    MAX_ACCOUNTS: 1,
    MAX_TAGS: 10,
    MAX_STRATEGIES: 2,
    MAX_ACTIVE_RULES: 3,
    MAX_COMPARE_DIMENSIONS: 1,
    MAX_IMPORT_TRADES: 25,
  },
  PRO: {
    MAX_TRADES: Infinity,
    MAX_SCREENSHOTS: 5,
    MAX_ACCOUNTS: Infinity,
    MAX_TAGS: Infinity,
    MAX_STRATEGIES: Infinity,
    MAX_ACTIVE_RULES: Infinity,
    MAX_COMPARE_DIMENSIONS: 7,
    MAX_IMPORT_TRADES: Infinity,
  },
};

// Helper function to get limits based on plan status
const getPlanLimits = (isPro) => {
  return isPro ? PLAN_LIMITS.PRO : PLAN_LIMITS.FREE;
};

// Individual helper functions for specific limits
const getMaxScreenshots = (isPro) => {
  return isPro
    ? PLAN_LIMITS.PRO.MAX_SCREENSHOTS
    : PLAN_LIMITS.FREE.MAX_SCREENSHOTS;
};

const getMaxAccounts = (isPro) => {
  return isPro ? PLAN_LIMITS.PRO.MAX_ACCOUNTS : PLAN_LIMITS.FREE.MAX_ACCOUNTS;
};

const getMaxTags = (isPro) => {
  return isPro ? PLAN_LIMITS.PRO.MAX_TAGS : PLAN_LIMITS.FREE.MAX_TAGS;
};

const getMaxStrategies = (isPro) => {
  return isPro
    ? PLAN_LIMITS.PRO.MAX_STRATEGIES
    : PLAN_LIMITS.FREE.MAX_STRATEGIES;
};

const getMaxCompareDimensions = (isPro) => {
  return isPro
    ? PLAN_LIMITS.PRO.MAX_COMPARE_DIMENSIONS
    : PLAN_LIMITS.FREE.MAX_COMPARE_DIMENSIONS;
};

const getMaxTrades = (isPro) => getPlanLimits(isPro).MAX_TRADES;
const getMaxActiveRules = (isPro) => getPlanLimits(isPro).MAX_ACTIVE_RULES;
const getMaxImportTrades = (isPro) => getPlanLimits(isPro).MAX_IMPORT_TRADES;

module.exports = {
  PLAN_LIMITS,
  getPlanLimits,
  getMaxScreenshots,
  getMaxAccounts,
  getMaxTags,
  getMaxStrategies,
  getMaxCompareDimensions,
  getMaxTrades,
  getMaxActiveRules,
  getMaxImportTrades,
};
