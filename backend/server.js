// backend/server.js
// ─────────────────────────────────────────────────
//  SaaS PM — Express Backend Entry Point
//  Start with: node server.js
//  Runs on:    http://localhost:3000
// ─────────────────────────────────────────────────

require('dotenv').config(); // Load .env variables FIRST before anything else

const express = require('express');
const cors    = require('cors');
const path    = require('path');

// ── Import Middleware ─────────────────────────────
const auth = require('./middleware/auth');
const rbac = require('./middleware/rbac');

// ── Import Route Handlers ─────────────────────────
const authRoutes     = require('./routes/auth');
const adminRoutes    = require('./routes/admin');
const managerRoutes  = require('./routes/manager');
const employeeRoutes = require('./routes/employee');
const profileRoutes = require('./routes/profile');
const subscriptionRoutes = require('./routes/subscription');


// ── Create Express App ────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ════════════════════════════════════════════════
//  GLOBAL MIDDLEWARE
// ════════════════════════════════════════════════

// CORS — Allow requests from your frontend (adjust origin in production)
app.use(cors({
  origin: [
    'http://localhost:5500',   // VS Code Live Server default
    'http://127.0.0.1:5500',
    'http://localhost:3001',   // Alternative frontend port
  ],
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data (for HTML forms if needed)
app.use(express.urlencoded({ extended: true }));

// Request Logger (shows every incoming request in terminal)
app.use((req, res, next) => {
  const time = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  console.log(`[${time}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/profile', profileRoutes);

app.use('/api/subscription', subscriptionRoutes);

// ════════════════════════════════════════════════
//  ROUTES
// ════════════════════════════════════════════════

// ── Public Routes (no auth required) ─────────────
// POST /api/auth/register  → Create tenant + admin
// POST /api/auth/login     → Login, returns JWT
app.use('/api/auth', authRoutes);

// ── Protected: Admin only ─────────────────────────
// auth    → Verifies JWT token
// rbac    → Checks role is 'admin'
app.use('/api/admin', auth, rbac('admin'), adminRoutes);

// ── Protected: Manager only ──────────────────────
app.use('/api/manager', auth, rbac('manager'), managerRoutes);

// ── Protected: Employee only ─────────────────────
app.use('/api/employee', auth, rbac('employee'), employeeRoutes);

// ── Health Check ──────────────────────────────────
// GET /api/health → Quick check that server is alive
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SaaS PM API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

const ownerRoutes = require('./routes/owner');
// Add after existing routes (no auth for simplicity — add a secret key in production)
app.use('/api/owner', ownerRoutes);

// ════════════════════════════════════════════════
//  ERROR HANDLING
// ════════════════════════════════════════════════

// 404 — Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`,
  });
});

// 500 — Global error handler (catches unhandled errors from routes)
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message,
  });
});

// ════════════════════════════════════════════════
//  START SERVER
// ════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀  SaaS PM Server running`);
  console.log(`📡  http://localhost:${PORT}`);
  console.log(`🌍  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  Available API endpoints:');
  console.log('  POST  /api/auth/register');
  console.log('  POST  /api/auth/login');
  console.log('  GET   /api/admin/...');
  console.log('  GET   /api/manager/...');
  console.log('  GET   /api/employee/...');
  console.log('  GET   /api/health');
  console.log('');
});

module.exports = app; // Export for testing purposes