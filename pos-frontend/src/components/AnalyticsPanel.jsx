import React from 'react';
import { DollarSign, CheckCircle2, Clock, AlertTriangle, Boxes, TrendingUp } from 'lucide-react';

export default function AnalyticsPanel({ analytics, onClose }) {
  if (!analytics || !analytics.metrics) return null;
  const { metrics, topSelling } = analytics;

  return (
    <section className="analytics-section">
      <div className="section-header">
        <div>
          <h2>Operational Performance & Metrics</h2>
          <p className="text-muted">Live calculations aggregated from MongoDB transactions</p>
        </div>
        <button type="button" className="btn-close" onClick={onClose}>×</button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon bg-emerald-light">
            <DollarSign size={22} className="text-emerald" />
          </div>
          <div>
            <span className="metric-label">Total Realized Revenue</span>
            <h3 className="metric-value">${metrics.totalRevenue?.toFixed(2) || '0.00'}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-blue-light">
            <CheckCircle2 size={22} className="text-blue" />
          </div>
          <div>
            <span className="metric-label">Completed Orders</span>
            <h3 className="metric-value">{metrics.completedOrders || 0}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-amber-light">
            <Clock size={22} className="text-amber" />
          </div>
          <div>
            <span className="metric-label">Active Stock Holds</span>
            <h3 className="metric-value">{metrics.reservedOrders || 0}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-purple-light">
            <Boxes size={22} className="text-purple" />
          </div>
          <div>
            <span className="metric-label">Inventory Asset Valuation</span>
            <h3 className="metric-value">${metrics.inventoryValuation?.toFixed(2) || '0.00'}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-red-light">
            <AlertTriangle size={22} className="text-red" />
          </div>
          <div>
            <span className="metric-label">Low Stock Alerts</span>
            <h3 className="metric-value">{metrics.lowStockCount || 0}</h3>
          </div>
        </div>
      </div>

      {topSelling && topSelling.length > 0 && (
        <div className="top-sellers-card">
          <div className="card-title">
            <TrendingUp size={18} className="text-emerald" />
            <h4>Best-Selling Inventory</h4>
          </div>
          <div className="top-sellers-list">
            {topSelling.map((item, idx) => (
              <div key={idx} className="seller-item">
                <span className="seller-rank">#{idx + 1}</span>
                <span className="seller-name">{item._id}</span>
                <span className="seller-units">{item.unitsSold} units sold</span>
                <span className="seller-rev">${item.revenueGenerated?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
