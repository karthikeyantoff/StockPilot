import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertOctagon } from 'lucide-react';

function ReservationCountdown({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00');
        setIsExpired(true);
        return;
      }
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <span className={`countdown-tag ${isExpired ? 'expired' : 'active'}`}>
      <Clock size={12} />
      <span>{timeLeft} {isExpired ? '(Expired)' : ''}</span>
    </span>
  );
}

export default function OrderLifecycleTable({ orders, onCancelOrder }) {
  return (
    <section className="orders-section">
      <div className="section-header">
        <div>
          <h3>Order Audit History & Lifecycle Log</h3>
          <p className="text-muted">Real-time tracking of order reservations, payments, and release states</p>
        </div>
        <span className="badge badge-info">{orders.length} Total Orders</span>
      </div>

      <div className="table-responsive">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Items & Breakdown</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Stock Hold Window</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  No orders recorded yet. Complete a checkout to populate lifecycle logs.
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const isReserved = o.status === 'RESERVED';
                return (
                  <tr key={o._id}>
                    <td>
                      <span className="order-number">{o.orderNumber || o._id.slice(-8)}</span>
                      <br />
                      <small className="text-muted">
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </td>

                    <td>
                      <div className="order-items-preview">
                        {Array.isArray(o.items) && o.items.length > 0 ? (
                          o.items.map((it, idx) => (
                            <span key={idx} className="item-chip">
                              {it.name || 'Product'} × {it.quantity}
                            </span>
                          ))
                        ) : (
                          <span className="item-chip">Item × {o.quantity || 1}</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <strong>${o.totalAmount ? o.totalAmount.toFixed(2) : (o.quantity * 20).toFixed(2)}</strong>
                    </td>

                    <td>
                      {o.status === 'COMPLETED' && (
                        <span className="status-badge status-completed">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      )}
                      {o.status === 'RESERVED' && (
                        <span className="status-badge status-reserved">
                          <Clock size={13} /> Reserved
                        </span>
                      )}
                      {o.status === 'CANCELLED' && (
                        <span className="status-badge status-cancelled">
                          <XCircle size={13} /> Cancelled
                        </span>
                      )}
                      {o.status === 'EXPIRED' && (
                        <span className="status-badge status-expired">
                          <AlertOctagon size={13} /> Expired
                        </span>
                      )}
                    </td>

                    <td>
                      {isReserved && o.expiresAt ? (
                        <ReservationCountdown expiresAt={o.expiresAt} />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    <td>
                      {isReserved ? (
                        <button
                          type="button"
                          className="btn-cancel-order"
                          onClick={() => onCancelOrder(o._id)}
                        >
                          Cancel & Release
                        </button>
                      ) : (
                        <span className="text-muted text-xs">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
