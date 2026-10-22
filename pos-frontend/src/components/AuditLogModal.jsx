import React from 'react';
import { Shield, Clock, User, X } from 'lucide-react';

export default function AuditLogModal({ logs, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Shield size={20} className="text-blue" />
            <h3>StockPilot Operational Audit Log</h3>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="text-muted text-sm mb-3">
            Immutable system logs recording administrative, checkout, stock movement, and auto-release events.
          </p>

          <div className="audit-log-list">
            {(!logs || logs.length === 0) ? (
              <p className="text-center text-muted py-4">No audit logs recorded yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="audit-entry">
                  <div className="audit-entry-header">
                    <span className={`audit-action-tag action-${log.action?.toLowerCase()}`}>
                      {log.action}
                    </span>
                    <span className="audit-time">
                      <Clock size={12} />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="audit-desc">{log.description}</p>
                  <div className="audit-footer">
                    <span className="audit-actor">
                      <User size={12} /> {log.performedBy || 'System'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
