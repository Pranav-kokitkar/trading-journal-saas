const ProGrant = require("../models/pro-grant-model");

const isPaidPro = (user, now = new Date()) =>
  user?.plan === "pro" &&
  user?.planExpiresAt &&
  new Date(user.planExpiresAt) > now;

const getActiveComplimentaryGrant = async (userId, now = new Date()) =>
  ProGrant.findOne({
    userId,
    revokedAt: null,
    $or: [{ duration: "lifetime" }, { expiresAt: { $gt: now } }],
  }).sort({ createdAt: -1 });

const hasEffectiveProAccess = async (user, now = new Date()) => {
  if (isPaidPro(user, now)) return true;
  if (!user?._id) return false;
  return Boolean(await getActiveComplimentaryGrant(user._id, now));
};

const getEffectiveProAccess = async (userId, now = new Date()) => {
  const User = require("../models/user-model");
  const user = await User.findById(userId).select("plan planExpiresAt");
  return hasEffectiveProAccess(user, now);
};

module.exports = {
  isPaidPro,
  getActiveComplimentaryGrant,
  hasEffectiveProAccess,
  getEffectiveProAccess,
};
