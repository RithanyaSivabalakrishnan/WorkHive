// backend/db.js
// MySQL2 Connection Pool
// Uses promise-based API so all queries use async/await
// All route files import this and call: db.query(sql, params) or db.getConnection()

const mysql  = require('mysql2');
require('dotenv').config();

// Create a pool (reuses up to 10 connections simultaneously)
const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  port:              Number(process.env.DB_PORT) || 3306,
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASSWORD || '',
  database:          process.env.DB_NAME     || 'saas_pm',
  waitForConnections: true,   // Queue requests when pool is full
  connectionLimit:   10,      // Max simultaneous connections
  queueLimit:        0,       // Unlimited queue (0 = no limit)
  timezone:          '+05:30', // IST — matches your system timezone
  charset:           'utf8mb4',
  multipleStatements: false,  // Security: prevent SQL injection via multiple statements
});

// Convert pool to use Promises (enables async/await)
const promisePool = pool.promise();

// ── Test the connection on startup ────────────────────────────────────────────
promisePool.query('SELECT 1')
  .then(() => console.log('✅  MySQL connected successfully'))
  .catch((err) => {
    console.error('❌  MySQL connection failed:', err.message);
    console.error('    Check your .env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    process.exit(1); // Stop server if DB is unreachable
  });

// ── Export the promise pool ───────────────────────────────────────────────────
// Usage in routes:
//   const db = require('../db');
//
//   Simple query:
//   const [rows] = await db.query('SELECT * FROM users WHERE tenant_id = ?', [id]);
//
//   Transaction (uses a connection directly):
//   const conn = await db.getConnection();
//   await conn.beginTransaction();
//   await conn.query(...);
//   await conn.commit();
//   conn.release();

module.exports = promisePool;