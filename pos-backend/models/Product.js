const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  sku: {
    type: String,
    trim: true,
    uppercase: true,
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0,
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Virtual for available stock (free stock not reserved)
productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockThreshold;
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
