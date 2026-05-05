const AuditLog = require("../models/audit-log-model");

const queryAudit = async (req, res) => {
  try {
    const {
      collection,
      documentId,
      userId,
      action,
      start,
      end,
      limit = 50,
    } = req.query;
    const q = {};
    if (collection) q.collection = collection;
    if (documentId) q.documentId = documentId;
    if (userId) q.userId = userId;
    if (action) q.action = action;
    if (start || end) q.timestamp = {};
    if (start) q.timestamp.$gte = new Date(start);
    if (end) q.timestamp.$lte = new Date(end);

    const results = await AuditLog.find(q)
      .sort({ timestamp: -1 })
      .limit(Math.min(Number(limit), 500))
      .lean();

    res.status(200).json({ results });
  } catch (err) {
    console.error("queryAudit error:", err);
    res.status(500).json({ message: "Failed to query audit logs" });
  }
};

module.exports = { queryAudit };
