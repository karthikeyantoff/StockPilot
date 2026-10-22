const Order = require('../models/Order');
const Product = require('../models/Product');

const getDashboardSummary = async (req, res) => {
  try {
    // 1. Total Revenue & Order Metrics via Aggregation
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSales: {
            $sum: {
              $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$totalAmount', 0],
            },
          },
        },
      },
    ]);

    let totalRevenue = 0;
    let completedOrders = 0;
    let reservedOrders = 0;
    let cancelledOrders = 0;
    let expiredOrders = 0;

    orderStats.forEach((stat) => {
      if (stat._id === 'COMPLETED') {
        totalRevenue += stat.totalSales;
        completedOrders += stat.count;
      } else if (stat._id === 'RESERVED') {
        reservedOrders += stat.count;
      } else if (stat._id === 'CANCELLED') {
        cancelledOrders += stat.count;
      } else if (stat._id === 'EXPIRED') {
        expiredOrders += stat.count;
      }
    });

    // 2. Inventory Metrics
    const products = await Product.find({ isActive: true });
    const totalProducts = products.length;
    let inventoryValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      inventoryValuation += p.price * p.stock;
      if (p.stock === 0) outOfStockCount++;
      else if (p.stock <= p.lowStockThreshold) lowStockCount++;
    });

    // 3. Top Selling Products (Aggregated from completed orders)
    const topSelling = await Order.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          unitsSold: { $sum: '$items.quantity' },
          revenueGenerated: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      metrics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        completedOrders,
        reservedOrders,
        cancelledOrders,
        expiredOrders,
        totalProducts,
        inventoryValuation: Number(inventoryValuation.toFixed(2)),
        lowStockCount,
        outOfStockCount,
      },
      topSelling,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute analytics: ' + err.message });
  }
};

module.exports = { getDashboardSummary };
