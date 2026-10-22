import React from 'react';
import { Package, ShieldCheck, RefreshCw, BarChart3, FileText, PlusCircle } from 'lucide-react';

export default function Navbar({ onOpenAddProduct, onOpenAuditLogs, onToggleAnalytics, showAnalytics, onRefresh, isRefreshing }) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="logo-badge">
            <Package size={22} className="logo-icon" />
          </div>
          <div>
            <h1 className="brand-title">StockPilot</h1>
            <p className="brand-subtitle">Retail Operations & POS Engine</p>
          </div>
        </div>

        <div className="navbar-actions">
          <button 
            type="button" 
            className={`nav-btn ${showAnalytics ? 'active' : ''}`}
            onClick={onToggleAnalytics}
            title="Toggle Analytics Dashboard"
          >
            <BarChart3 size={17} />
            <span>Analytics</span>
          </button>

          <button 
            type="button" 
            className="nav-btn"
            onClick={onOpenAuditLogs}
            title="View Real-Time Audit Logs"
          >
            <FileText size={17} />
            <span>Audit Logs</span>
          </button>

          <button 
            type="button" 
            className="nav-btn btn-accent"
            onClick={onOpenAddProduct}
          >
            <PlusCircle size={17} />
            <span>Add Product</span>
          </button>

          <button 
            type="button" 
            className={`icon-btn ${isRefreshing ? 'spin' : ''}`}
            onClick={onRefresh}
            title="Refresh Data"
          >
            <RefreshCw size={17} />
          </button>

          <div className="user-badge" title="Active Terminal Role">
            <ShieldCheck size={16} className="text-emerald" />
            <span>Admin / Cashier</span>
          </div>
        </div>
      </div>
    </header>
  );
}
