const express = require('express');
const router = express.Router();
const {
  reserveOrder,
  completeOrder,
  cancelOrder,
  getOrders,
  getAuditLogs,
} = require('../controllers/orderController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getOrders);
router.post('/reserve', optionalAuth, reserveOrder);
router.post('/complete', optionalAuth, completeOrder);
router.post('/cancel', optionalAuth, cancelOrder);
router.get('/audit-logs', optionalAuth, getAuditLogs);

module.exports = router;
