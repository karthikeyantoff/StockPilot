const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true,
  },
  entityType: {
    type: String,
    enum: ['ORDER', 'PRODUCT', 'USER', 'SYSTEM'],
    required: true,
  },
  entityId: {
    type: String,
  },
  description: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  performedBy: {
    type: String,
    default: 'System',
  },
  ipAddress: {
    type: String,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
