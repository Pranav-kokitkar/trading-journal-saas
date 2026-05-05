const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ["create", "update", "delete", "restore", "undo"],
    required: true,
  },
  collection: { type: String, required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String },
  before: { type: Object, default: {} },
  after: { type: Object, default: {} },
  diff: { type: Object, default: {} },
  reason: { type: String },
  metadata: { type: Object, default: {} },
});

auditSchema.index({ collection: 1, documentId: 1, timestamp: -1 });
auditSchema.index({ userId: 1, action: 1, timestamp: -1 });

const AuditLog = mongoose.model("AuditLog", auditSchema);

module.exports = AuditLog;
