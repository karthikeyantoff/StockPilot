import React from 'react';
import { ShoppingCart, AlertCircle } from 'lucide-react';

export default function ProductCard({ product, onAddToCart, cartQuantity }) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= (product.lowStockThreshold || 5);

  return (
    <div className={`product-card ${isOutOfStock ? 'card-out-of-stock' : ''}`}>
      <div className="product-card-top">
        <span className="product-category">{product.category || 'General'}</span>
        {product.sku && <span className="product-sku">{product.sku}</span>}
      </div>

      <h4 className="product-name">{product.name}</h4>

      <div className="product-pricing">
        <span className="price-tag">${product.price.toFixed(2)}</span>
      </div>

      <div className="stock-status-row">
        {isOutOfStock ? (
          <span className="badge badge-danger">
            <AlertCircle size={13} /> Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="badge badge-warning">
            <AlertCircle size={13} /> Only {product.stock} left
          </span>
        ) : (
          <span className="badge badge-success">
            {product.stock} in stock
          </span>
        )}

        {product.reservedStock > 0 && (
          <span className="text-muted text-xs">
            ({product.reservedStock} on hold)
          </span>
        )}
      </div>

      <button
        type="button"
        className={`btn-add-cart ${isOutOfStock ? 'disabled' : ''}`}
        disabled={isOutOfStock}
        onClick={() => onAddToCart(product)}
      >
        <ShoppingCart size={16} />
        <span>{cartQuantity > 0 ? `Add More (${cartQuantity})` : 'Add to Cart'}</span>
      </button>
    </div>
  );
}
