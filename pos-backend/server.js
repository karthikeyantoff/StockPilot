const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const { startExpirationWorker } = require('./services/expirationService');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Database Connection Middleware for Serverless & Long-running instances
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err.message);
    return res.status(500).json({ error: 'Database Connection Failed: ' + err.message });
  }
});

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    project: 'StockPilot',
    tagline: 'Cloud-Based Retail Operations & Inventory Management Platform',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
    service: 'StockPilot-Backend',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);

// Centralized 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Expiration Background Worker (Runs in regular Node processes)
if (process.env.NODE_ENV !== 'test') {
  startExpirationWorker(30000); // Check every 30s
}

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`[StockPilot] Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
