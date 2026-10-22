const Order = require('../models/Order');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

/**
 * Scan for expired reserved orders and restore product inventory.
 * Concurrency-safe: uses findOneAndUpdate with status 'RESERVED' check.
 */
const cleanupExpiredOrders = async () => {
  try {
    const now = new Date();
    const expiredOrders = await Order.find({
      status: 'RESERVED',
      expiresAt: { $lte: now },
    });

    if (expiredOrders.length === 0) return { expiredCount: 0 };

    let processedCount = 0;

    for (const order of expiredOrders) {
      // Atomically transition from RESERVED to EXPIRED to prevent duplicate processing
      const lockedOrder = await Order.findOneAndUpdate(
        { _id: order._id, status: 'RESERVED' },
        { $set: { status: 'EXPIRED' } },
        { new: true }
      );

      if (!lockedOrder) continue;

      // Restore stock for all items in the expired order
      for (const item of lockedOrder.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { 
            stock: item.quantity, 
            reservedStock: -item.quantity 
          },
        });
      }

      // Record in Audit Log
      await AuditLog.create({
        action: 'ORDER_EXPIRED',
        entityType: 'ORDER',
        entityId: lockedOrder._id.toString(),
        description: `Order ${lockedOrder.orderNumber} expired. Restored ${lockedOrder.items.length} item(s) to stock.`,
        metadata: {
          orderNumber: lockedOrder.orderNumber,
          itemsCount: lockedOrder.items.length,
          totalAmount: lockedOrder.totalAmount,
        },
        performedBy: 'System (StockPilot Auto-Release Worker)',
      });

      processedCount++;
    }

    if (processedCount > 0) {
      console.log(`[StockPilot Worker] Released stock for ${processedCount} expired order(s).`);
    }

    return { expiredCount: processedCount };
  } catch (err) {
    console.error('[StockPilot Worker] Error during order expiration cleanup:', err.message);
    return { error: err.message };
  }
};

let intervalId = null;

const startExpirationWorker = (intervalMs = 30000) => {
  if (intervalId) return;
  // Run once immediately on start
  cleanupExpiredOrders();
  intervalId = setInterval(cleanupExpiredOrders, intervalMs);
  console.log(`[StockPilot Worker] Auto-release expiration service active (interval: ${intervalMs / 1000}s)`);
};

const stopExpirationWorker = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

module.exports = { cleanupExpiredOrders, startExpirationWorker, stopExpirationWorker };
