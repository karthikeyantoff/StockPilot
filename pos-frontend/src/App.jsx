import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import AnalyticsPanel from './components/AnalyticsPanel';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import OrderLifecycleTable from './components/OrderLifecycleTable';
import AddProductModal from './components/AddProductModal';
import AuditLogModal from './components/AuditLogModal';
import { Search, Filter, Sparkles } from 'lucide-react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : ''
);

export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  // 2. Fetch Orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, []);

  // 3. Fetch Analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/summary`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, []);

  // 4. Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  }, []);

  // Comprehensive Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchProducts(), fetchOrders(), fetchAnalytics()]);
    setIsRefreshing(false);
  };

  // Seed demo data if database is empty
  const handleSeedDemoData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/seed`, { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Demo products seeded!', 'success');
      handleRefresh();
    } catch (err) {
      showToast('Failed to seed demo data', 'error');
    }
  };

  // Polite background polling (30s interval instead of previous aggressive 2s)
  useEffect(() => {
    handleRefresh();
    const interval = setInterval(() => {
      fetchProducts();
      fetchOrders();
      fetchAnalytics();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchProducts, fetchOrders, fetchAnalytics]);

  // Cart operations
  const handleAddToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Cannot add more than ${product.stock} available units of ${product.name}`, 'warning');
          return prev;
        }
        return prev.map((i) =>
          i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    const product = products.find((p) => p._id === productId);
    if (product && newQty > product.stock) {
      showToast(`Only ${product.stock} units available in stock`, 'warning');
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: newQty } : i))
    );
  };

  const handleRemoveItem = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleClearCart = () => setCart([]);

  // ATOMIC CART CHECKOUT
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setIsProcessing(true);
      const idempotencyKey = `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const payload = {
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        idempotencyKey,
      };

      const res = await fetch(`${API_BASE_URL}/api/orders/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reserve stock');
      }

      showToast(`Stock reserved for ${data.order.orderNumber}! Ready for payment.`, 'success');
      setActiveOrder(data.order);
      setCart([]);
      handleRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Mock Payment Success
  const handlePaymentSuccess = async () => {
    if (!activeOrder) return;
    try {
      setIsProcessing(true);
      const res = await fetch(`${API_BASE_URL}/api/orders/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: activeOrder._id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment confirmation failed');

      showToast(`Payment successful! Order ${activeOrder.orderNumber} completed.`, 'success');
      setActiveOrder(null);
      handleRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Mock Payment Failure (Releases stock back)
  const handlePaymentFailure = async () => {
    if (!activeOrder) return;
    try {
      setIsProcessing(true);
      const res = await fetch(`${API_BASE_URL}/api/orders/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: activeOrder._id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to release reservation');

      showToast('Payment simulation cancelled. Reserved stock released to inventory.', 'warning');
      setActiveOrder(null);
      handleRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel order directly from lifecycle log
  const handleCancelOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancellation failed');

      showToast(data.message || 'Order cancelled and stock restored.', 'success');
      handleRefresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Add new product
  const handleAddProduct = async (productData) => {
    const res = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create product');

    showToast(`Product "${data.name}" added to inventory catalog!`, 'success');
    handleRefresh();
  };

  // Filter products by category and search term
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(products.map((p) => p.category || 'General'))];

  return (
    <div className="stockpilot-app">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`toast toast-${toastMessage.type}`}>
          {toastMessage.message}
        </div>
      )}

      {/* Main Navigation */}
      <Navbar
        onOpenAddProduct={() => setIsAddModalOpen(true)}
        onOpenAuditLogs={() => {
          fetchAuditLogs();
          setIsAuditModalOpen(true);
        }}
        onToggleAnalytics={() => setShowAnalytics(!showAnalytics)}
        showAnalytics={showAnalytics}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="app-main-container">
        {/* Analytics Panel */}
        {showAnalytics && (
          <AnalyticsPanel
            analytics={analytics}
            onClose={() => setShowAnalytics(false)}
          />
        )}

        {/* Catalog & Register Workspace */}
        <div className="workspace-grid">
          {/* Products Catalog View */}
          <section className="catalog-section">
            <div className="catalog-toolbar">
              <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="category-filter-chips">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="empty-catalog-state">
                <p>No inventory items found matching your filter.</p>
                {products.length === 0 && (
                  <button
                    type="button"
                    className="btn-seed"
                    onClick={handleSeedDemoData}
                  >
                    <Sparkles size={16} /> Seed Default Inventory Items
                  </button>
                )}
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product) => {
                  const inCartItem = cart.find((i) => i.productId === product._id);
                  return (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      cartQuantity={inCartItem ? inCartItem.quantity : 0}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Cart Sidebar */}
          <CartDrawer
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            activeOrder={activeOrder}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
            isProcessing={isProcessing}
          />
        </div>

        {/* Order Lifecycle & Audit History */}
        <OrderLifecycleTable
          orders={orders}
          onCancelOrder={handleCancelOrder}
        />
      </main>

      {/* Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {isAuditModalOpen && (
        <AuditLogModal
          logs={auditLogs}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}
    </div>
  );
}
