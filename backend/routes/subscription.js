// backend/routes/subscription.js

const express = require('express');
const router  = express.Router();          // ← THIS was missing
const db      = require('../db');
const authenticateToken = require('../middleware/auth');
const checkSubscription      = require('../middleware/checkSubscription');

// ADD THESE to diagnose:
console.log('authenticateToken:', typeof authenticateToken);
console.log('checkSubscription:', typeof checkSubscription);

// GET /api/subscription/status
router.get('/status', authenticateToken, checkSubscription, (req, res) => {
  res.json({
    success: true,
    data: req.subscription
  });
});

// POST /api/subscription/renew
router.post('/renew', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required.' });
  }

  const { plan } = req.body;
  const durations = { free: 30, pro: 365, enterprise: 365 };
  const days = durations[plan] || 30;

  try {
    await db.query(
      `UPDATE tenants
       SET plan=?, subscription_start=CURDATE(),
           subscription_end=DATE_ADD(CURDATE(), INTERVAL ? DAY),
           subscription_status='active'
       WHERE tenant_id=?`,
      [plan, days, req.user.tenant_id]
    );
    res.json({ success: true, message: `Plan updated to ${plan}. Active for ${days} days.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Renewal failed.' });
  }
});

module.exports = router;                   // ← make sure this is at the bottom
