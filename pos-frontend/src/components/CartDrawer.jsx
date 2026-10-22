import React from 'react';
import { ShoppingBag, Trash2, Plus, Minus, CreditCard, ShieldCheck } from 'lucide-react';

export default function CartDrawer({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  activeOrder,
  onPaymentSuccess,
  onPaymentFailure,
  isProcessing,
}) {
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <aside className="cart-card">
      <div className="cart-header">
        <div className="cart-title">
          <ShoppingBag size={20} className="text-blue" />
          <h3>Active Register Cart</h3>
        </div>
        {cart.length > 0 && (
          <button type="button" className="btn-text-danger" onClick={onClearCart}>
            Clear
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="cart-empty-state">
          <p>Register cart is empty</p>
          <span className="text-muted text-sm">Select products from the catalog to build an order</span>
        </div>
      ) : (
        <div className="cart-items-container">
          <div className="cart-items-list">
            {cart.map((item) => (
              <div key={item.productId} className="cart-item-row">
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">${item.price.toFixed(2)} each</span>
                </div>

                <div className="cart-item-controls">
                  <div className="qty-stepper">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="qty-number">{item.quantity}</span>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <span className="cart-item-subtotal">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>

                  <button
                    type="button"
                    className="btn-trash"
                    onClick={() => onRemoveItem(item.productId)}
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary-box">
            <div className="summary-row">
              <span>Items Total ({cart.reduce((c, i) => c + i.quantity, 0)} units):</span>
              <span className="summary-price">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="summary-row total-highlight">
              <strong>Order Total:</strong>
              <strong>${totalAmount.toFixed(2)}</strong>
            </div>

            <button
              type="button"
              className="btn-checkout"
              disabled={isProcessing}
              onClick={onCheckout}
            >
              <ShieldCheck size={18} />
              <span>{isProcessing ? 'Reserving Stock...' : 'Atomic Reserve & Checkout'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Order Mock Gateway Modal/Card */}
      {activeOrder && (
        <div className="mock-payment-box">
          <div className="gateway-header">
            <CreditCard size={18} className="text-emerald" />
            <h4>Payment Gateway Simulation</h4>
          </div>
          <p className="gateway-order-id">
            Holding Order: <strong>{activeOrder.orderNumber}</strong>
          </p>
          <p className="gateway-total">
            Payable: <strong>${activeOrder.totalAmount?.toFixed(2)}</strong>
          </p>

          <div className="gateway-actions">
            <button
              type="button"
              className="btn-gateway-success"
              disabled={isProcessing}
              onClick={onPaymentSuccess}
            >
              Simulate Payment Success
            </button>
            <button
              type="button"
              className="btn-gateway-fail"
              disabled={isProcessing}
              onClick={onPaymentFailure}
            >
              Simulate Payment Failure (Release Stock)
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
