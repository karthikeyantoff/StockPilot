import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';

export default function AddProductModal({ isOpen, onClose, onAddProduct }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Hardware',
    price: '',
    stock: '',
    lowStockThreshold: '5',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || formData.price === '' || formData.stock === '') {
      setError('Please fill in Product Name, Price, and Stock Quantity.');
      return;
    }

    const priceNum = parseFloat(formData.price);
    const stockNum = parseInt(formData.stock, 10);
    const threshNum = parseInt(formData.lowStockThreshold, 10) || 5;

    if (isNaN(priceNum) || priceNum < 0) {
      setError('Price must be a valid positive number.');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setError('Stock quantity must be a non-negative integer.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddProduct({
        name: formData.name.trim(),
        sku: formData.sku.trim() || undefined,
        category: formData.category,
        price: priceNum,
        stock: stockNum,
        lowStockThreshold: threshNum,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <PlusCircle size={20} className="text-emerald" />
            <h3>Add New Product to Inventory</h3>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="alert-box alert-error">{error}</div>}

          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              placeholder="e.g. Wireless Barcode Scanner"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>SKU (Stock Keeping Unit)</label>
              <input
                type="text"
                placeholder="e.g. SKU-SCN90"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Hardware">Hardware</option>
                <option value="Supplies">Supplies</option>
                <option value="Accessories">Accessories</option>
                <option value="Electronics">Electronics</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="49.99"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Initial Stock *</label>
              <input
                type="number"
                min="0"
                placeholder="20"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Low Threshold</label>
              <input
                type="number"
                min="1"
                placeholder="5"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
