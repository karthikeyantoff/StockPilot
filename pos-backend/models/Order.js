const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  items: {
    type: [orderItemSchema],
    validate: {
      validator: (items) => Array.isArray(items) && items.length > 0,
      message: 'An order must contain at least one item',
    },
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['RESERVED', 'COMPLETED', 'CANCELLED', 'EXPIRED'],
    default: 'RESERVED',
    index: true,
  },
  idempotencyKey: {
    type: String,
    sparse: true,
    index: true,
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'ONLINE', 'MOCK'],
    default: 'MOCK',
  },
  cashierName: {
    type: String,
    default: 'Default Cashier',
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  completedAt: {
    type: Date,
  },
  cancelledAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
