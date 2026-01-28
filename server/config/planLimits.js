const PLAN_LIMITS = {
  FREE: {
    MAX_SCREENSHOTS: 2,
    MAX_ACCOUNTS: 3,
    MAX_TAGS: 5,
  },
  PRO: {
    MAX_SCREENSHOTS: 5,
    MAX_ACCOUNTS: 10,
    MAX_TAGS: 50,
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

module.exports = {
  PLAN_LIMITS,
  getPlanLimits,
  getMaxScreenshots,
  getMaxAccounts,
  getMaxTags,
};
