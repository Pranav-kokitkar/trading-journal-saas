const AuditLog = require("../models/audit-log-model");

const shallowDiff = (before = {}, after = {}) => {
  const diff = {};
  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);
  keys.forEach((k) => {
    const bv = before ? before[k] : undefined;
    const av = after ? after[k] : undefined;
    // treat Date objects specially
    const bvs = bv instanceof Date ? bv.toISOString() : bv;
    const avs = av instanceof Date ? av.toISOString() : av;
    if (typeof bvs === "object" && typeof avs === "object") {
      try {
        if (JSON.stringify(bvs) !== JSON.stringify(avs)) {
          diff[k] = { from: bv, to: av };
        }
      } catch (e) {
        diff[k] = { from: bv, to: av };
      }
    } else if (bvs !== avs) {
      diff[k] = { from: bv, to: av };
    }
  });
  return diff;
};

const log = async ({
  action,
  collection,
  documentId,
  userId,
  ip,
  before,
  after,
  reason,
  metadata,
}) => {
  try {
    const entry = new AuditLog({
      action,
      collection,
      documentId,
      userId,
      ip,
      before: before || {},
      after: after || {},
      diff: shallowDiff(before, after),
      reason: reason || undefined,
      metadata: metadata || {},
    });
    await entry.save();
    return entry;
  } catch (err) {
    console.error("Audit log error:", err);
    return null;
  }
};

const getRecentForDocument = async (collection, documentId, limit = 10) => {
  return AuditLog.find({ collection, documentId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

module.exports = { log, getRecentForDocument };
