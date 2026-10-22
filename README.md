# StockPilot — Cloud-Based Retail Operations & Inventory Management Platform

StockPilot is an industry-grade, full-stack MERN (MongoDB, Express, React, Node.js) platform built for modern retail operations. It combines high-concurrency inventory controls, atomic multi-item point-of-sale (POS) workflows, active reservation expiration with automatic stock restitution, operational audit logging, and real-time business analytics.

---

## 📌 Origin & Engineering Attribution

- **Original Foundation:** Based on the open-source prototype *POS Order & Inventory Management System* by [Sashini Weliketiya](https://github.com/SashiniWeliketiya/POS-Order-Inventory-System).
- **Modernization & Architecture:** Extensively re-engineered, modularized, and hardened into **StockPilot** by **Karthikeyan T** (`@karthikeyantoff`).

### Key Engineering Contributions & Refactoring:
1. **Resolved Concurrency Stock-Leak (MongoDB TTL Flaw):** Replaced passive document deletion with an active background auto-release worker (`services/expirationService.js`) that monitors hold windows and atomically returns reserved stock back to active inventory upon expiration.
2. **Atomic Multi-Item Cart Checkout:** Replaced sequential client-side HTTP request loops with a single transactional reservation endpoint supporting rollback safety across all items in a cart.
3. **Idempotency Protection:** Enforced unique `Idempotency-Key` headers on checkout transactions to prevent duplicate orders during network retries.
4. **Eliminated Polling Bottleneck:** Removed aggressive 2000ms `setInterval` serverless connection churn, replacing it with event-driven state updates and on-demand synchronization.
5. **Role-Based Access Control (RBAC):** Added JWT authentication and password hashing (`bcryptjs`) supporting `Admin`, `Manager`, and `Cashier` roles.
6. **Real Database Aggregation Analytics:** Replaced hardcoded metrics with live MongoDB aggregation pipelines calculating revenue, asset valuation, and best-selling inventory.
7. **Immutable Operational Audit Logging:** Dedicated `AuditLog` collection recording product mutations, stock movements, manual cancellations, and automated worker releases.
8. **Modular Frontend Architecture:** Decomposed a 376-line monolithic component into clean, reusable React 19 components with searchable catalogs and category filters.

---

## 🛠 Tech Stack

- **Frontend:** React 19, Vite 8, Lucide React, Modern CSS System
- **Backend:** Node.js (v20+), Express 5, Mongoose 9, Node-Cron, JWT, Bcryptjs
- **Database:** MongoDB (Local or MongoDB Atlas)
- **Quality & Testing:** Node Test Runner (`node --test`), Vite build verification
- **Deployment Targets:** Vercel (Frontend), Render / Railway (Backend), MongoDB Atlas (Database)

---

## 📁 Repository Architecture

```text
coursera_project/
├── .gitignore                      # Clean production gitignore rules
├── README.md                       # Master documentation & attribution
├── pos-backend/                    # Express API Microservice
│   ├── config/
│   │   └── db.js                   # Mongoose connection pooling & caching
│   ├── controllers/
│   │   ├── authController.js       # Register, login, and demo account seeder
│   │   ├── productController.js    # Catalog, stock adjustments, search/filter
│   │   ├── orderController.js      # Atomic multi-item reservations & checkout
│   │   └── analyticsController.js  # MongoDB aggregation pipelines
│   ├── middleware/
│   │   └── auth.js                 # JWT verification and RBAC guards
│   ├── models/
│   │   ├── User.js                 # User credentials & role definitions
│   │   ├── Product.js              # Product SKU, stock, and low-stock threshold
│   │   ├── Order.js                # Multi-item order schema & idempotency index
│   │   └── AuditLog.js             # Immutable operational audit trail
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth
│   │   ├── productRoutes.js        # /api/products
│   │   ├── orderRoutes.js          # /api/orders
│   │   └── analyticsRoutes.js      # /api/analytics
│   ├── services/
│   │   └── expirationService.js    # Concurrency auto-release worker
│   ├── test/
│   │   └── api.test.js             # Automated unit/integration tests
│   ├── server.js                   # Server bootstrap & healthcheck
│   ├── .env.example
│   └── package.json
└── pos-frontend/                   # React + Vite Single Page Application
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx          # Brand header & role indicators
    │   │   ├── AnalyticsPanel.jsx  # Live business KPIs & best-sellers
    │   │   ├── ProductCard.jsx     # Catalog items with stock status
    │   │   ├── CartDrawer.jsx      # Multi-item cart & mock payment gateway
    │   │   ├── OrderLifecycleTable.jsx # Live reservation countdown & history
    │   │   ├── AddProductModal.jsx # Product creation & restock modal
    │   │   └── AuditLogModal.jsx   # Real-time operational audit log modal
    │   ├── App.jsx                 # Application layout & state manager
    │   ├── App.css                 # Enterprise SaaS stylesheet
    │   └── main.jsx
    ├── index.html
    ├── .env.example
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Quickstart & Local Setup Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local Community Server or MongoDB Atlas URI)

### 2. Backend Setup
In a PowerShell terminal:
```powershell
cd pos-backend
Copy-Item .env.example .env
# Edit .env with your MongoDB connection string (MONGO_URI)
npm install
npm run dev
```
*Backend runs by default at `http://localhost:5000`.*  
*Health Check: `http://localhost:5000/api/health`*

### 3. Frontend Setup
In a second PowerShell terminal:
```powershell
cd pos-frontend
Copy-Item .env.example .env
npm install
npm run dev
```
*Frontend runs by default at `http://localhost:5173`.*

---

## 🧪 Automated Testing

Execute the backend automated test suite:
```powershell
cd pos-backend
npm test
```

Execute frontend build verification:
```powershell
cd pos-frontend
npm run build
```

---

## 🛡 Concurrency & Reservation Engine Explained

1. **Reservation Hold:** When items are added to a cart and checkout is initiated, StockPilot atomically checks and reserves inventory using:
   ```javascript
   Product.findOneAndUpdate(
     { _id: productId, stock: { $gte: quantity } },
     { $inc: { stock: -quantity, reservedStock: quantity } }
   );
   ```
2. **Rollback Safety:** If any single item in a multi-item cart has insufficient stock, all previously reserved items in that transaction are rolled back automatically.
3. **5-Minute Expiration Window:** Orders are assigned an `expiresAt` timestamp (5 minutes). A persistent background worker runs every 30 seconds:
   - Any order remaining in `RESERVED` beyond 5 minutes is converted to `EXPIRED`.
   - The worker automatically executes `$inc: { stock: quantity, reservedStock: -quantity }` to restore inventory to the catalog.
   - The auto-release action is recorded in the operational audit log.

---

## 📜 License

Distributed under the MIT License. See individual files for legacy ISC component references.
