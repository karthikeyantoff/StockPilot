const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/analyticsController');
const { optionalAuth } = require('../middleware/auth');

router.get('/summary', optionalAuth, getDashboardSummary);

module.exports = router;
