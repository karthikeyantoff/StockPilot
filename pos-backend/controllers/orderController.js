const Order = require('../models/Order');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const { cleanupExpiredOrders } = require('../services/expirationService');

// Helper to generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${random}`;
};

// 1. Reserve Stock & Create Order (Atomic Multi-Item Cart Support)
const reserveOrder = async (req, res) => {
  const rollbackList = []; // Track reservations to rollback on failure
  try {
    const body = req.body || {};
    const idempotencyKey = req.headers['idempotency-key'] || body.idempotencyKey;

    // Check Idempotency Key to prevent duplicate checkouts
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        return res.status(200).json({
          message: 'Order already processed (Idempotent response)',
          order: existingOrder,
          isDuplicate: true,
        });
      }
    }

    // Normalize input: Support both multi-item cart (items: [...]) and legacy single-item ({ productId, quantity })
    let rawItems = [];
    if (Array.isArray(body.items) && body.items.length > 0) {
      rawItems = body.items;
    } else if (body.productId) {
      rawItems = [{ productId: body.productId, quantity: body.quantity || 1 }];
    } else {
      return res.status(400).json({ error: 'Please provide items with productId and quantity.' });
    }

    const orderItems = [];
    let totalAmount = 0;

    // Concurrency-safe atomic reserve loop
    for (const raw of rawItems) {
      const qty = Number(raw.quantity);
      if (!raw.productId || isNaN(qty) || qty <= 0) {
        throw new Error(`Invalid item payload or quantity for product ${raw.productId}`);
      }

      // Concurrency check: Deduct stock atomically only if available
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: raw.productId, stock: { $gte: qty }, isActive: true },
        { $inc: { stock: -qty, reservedStock: qty } },
        { new: true }
      );

      if (!updatedProduct) {
        const productInfo = await Product.findById(raw.productId);
        const name = productInfo ? productInfo.name : 'Selected product';
        const available = productInfo ? productInfo.stock : 0;
        throw new Error(`Insufficient stock for "${name}". Available: ${available}, Requested: ${qty}`);
      }

      rollbackList.push({ productId: raw.productId, quantity: qty });

      const subtotal = Number((updatedProduct.price * qty).toFixed(2));
      totalAmount += subtotal;

      orderItems.push({
        productId: updatedProduct._id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        quantity: qty,
        subtotal,
      });
    }

    // Order expires 5 minutes from reservation
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const order = new Order({
      orderNumber: generateOrderNumber(),
      items: orderItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      status: 'RESERVED',
      idempotencyKey: idempotencyKey || undefined,
      paymentMethod: req.body.paymentMethod || 'MOCK',
      cashierName: req.user ? req.user.name : 'POS Terminal #1',
      expiresAt,
    });

    await order.save();

    await AuditLog.create({
      action: 'ORDER_RESERVED',
      entityType: 'ORDER',
      entityId: order._id.toString(),
      description: `Stock reserved for Order ${order.orderNumber} (${order.items.length} items, Total: $${order.totalAmount})`,
      metadata: {
        orderNumber: order.orderNumber,
        itemsCount: order.items.length,
        totalAmount: order.totalAmount,
      },
      performedBy: req.user ? `${req.user.name} (${req.user.role})` : 'Cashier Terminal',
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: 'Stock reserved successfully',
      order,
    });
  } catch (err) {
    // ATOMIC ROLLBACK: Restore reserved stock if any product in the cart failed
    for (const rb of rollbackList) {
      await Product.findByIdAndUpdate(rb.productId, {
        $inc: { stock: rb.quantity, reservedStock: -rb.quantity },
      });
    }

    res.status(400).json({ error: err.message });
  }
};

// 2. Complete Order (Payment confirmation)
const completeOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Run expiration cleanup first to ensure we don't complete an expired order
    await cleanupExpiredOrders();

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'RESERVED') {
      return res.status(400).json({
        error: `Order cannot be completed. Current status: ${order.status}`,
      });
    }

    if (new Date() > new Date(order.expiresAt)) {
      return res.status(400).json({ error: 'Order reservation expired before payment completed.' });
    }

    // Deduct from reservedStock permanently
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { reservedStock: -item.quantity },
      });
    }

    order.status = 'COMPLETED';
    order.completedAt = new Date();
    await order.save();

    await AuditLog.create({
      action: 'ORDER_COMPLETED',
      entityType: 'ORDER',
      entityId: order._id.toString(),
      description: `Payment confirmed for Order ${order.orderNumber}. Sale completed ($${order.totalAmount}).`,
      metadata: { orderNumber: order.orderNumber, totalAmount: order.totalAmount },
      performedBy: req.user ? `${req.user.name} (${req.user.role})` : 'POS Gateway',
      ipAddress: req.ip,
    });

    res.json({
      message: 'Payment verified and order successfully completed!',
      order,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete order: ' + err.message });
  }
};

// 3. Cancel Order (Restores reserved stock immediately)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'RESERVED') {
      return res.status(400).json({
        error: `Only RESERVED orders can be cancelled. Current status is ${order.status}`,
      });
    }

    // Restore stock back to products
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity, reservedStock: -item.quantity },
      });
    }

    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    await order.save();

    await AuditLog.create({
      action: 'ORDER_CANCELLED',
      entityType: 'ORDER',
      entityId: order._id.toString(),
      description: `Order ${order.orderNumber} cancelled manually. Stock restored to inventory.`,
      metadata: { orderNumber: order.orderNumber },
      performedBy: req.user ? `${req.user.name} (${req.user.role})` : 'User',
      ipAddress: req.ip,
    });

    res.json({
      message: 'Order cancelled successfully and reserved stock restored.',
      order,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order: ' + err.message });
  }
};

// 4. Get All Orders with pagination and auto-expiration sync
const getOrders = async (req, res) => {
  try {
    // Run real-time check for any expired orders before returning list
    await cleanupExpiredOrders();

    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve orders: ' + err.message });
  }
};

// 5. Get Audit Logs
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit logs: ' + err.message });
  }
};

module.exports = {
  reserveOrder,
  completeOrder,
  cancelOrder,
  getOrders,
  getAuditLogs,
};
