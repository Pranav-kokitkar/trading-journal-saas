// Global Plan Limits Configuration
// Single source of truth for all plan-based limits

export const PLAN_LIMITS = {
  FREE: {
    MAX_SCREENSHOTS: 2,
    MAX_ACCOUNTS: 1,
    MAX_TAGS: 5,
  },
  PRO: {
    MAX_SCREENSHOTS: 5,
    MAX_ACCOUNTS: 10,
    MAX_TAGS: 50,
  },
};

// Helper function to get limits based on plan status
export const getPlanLimits = (isPro) => {
  return isPro ? PLAN_LIMITS.PRO : PLAN_LIMITS.FREE;
};

// Individual helper functions for specific limits
export const getMaxScreenshots = (isPro) => {
  return isPro
    ? PLAN_LIMITS.PRO.MAX_SCREENSHOTS
    : PLAN_LIMITS.FREE.MAX_SCREENSHOTS;
};

export const getMaxAccounts = (isPro) => {
  return isPro ? PLAN_LIMITS.PRO.MAX_ACCOUNTS : PLAN_LIMITS.FREE.MAX_ACCOUNTS;
};

export const getMaxTags = (isPro) => {
  return isPro ? PLAN_LIMITS.PRO.MAX_TAGS : PLAN_LIMITS.FREE.MAX_TAGS;
};
