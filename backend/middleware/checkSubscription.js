// middleware/checkSubscription.js
const db = require('../db');

const checkSubscription = async (req, res, next) => {
  try {
    const tenant_id = req.user?.tenant_id;
    if (!tenant_id) return next(); // skip if no auth context

    const [[tenant]] = await db.query(
      `SELECT plan, subscription_end, subscription_status
       FROM tenants WHERE tenant_id = ?`,
      [tenant_id]
    );

    if (!tenant) return next();

    const today = new Date();
    const endDate = tenant.subscription_end ? new Date(tenant.subscription_end) : null;

    // Auto-update status if expired
    if (endDate && today > endDate && tenant.subscription_status !== 'expired') {
      await db.query(
        `UPDATE tenants SET subscription_status='expired' WHERE tenant_id=?`,
        [tenant_id]
      );
      tenant.subscription_status = 'expired';
    }

    // Attach to request for use in routes
    req.subscription = {
      plan:    tenant.plan,
      end:     tenant.subscription_end,
      status:  tenant.subscription_status,
      expired: tenant.subscription_status === 'expired',
      daysLeft: endDate
        ? Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)))
        : null
    };

    next();
  } catch (err) {
    console.error('Subscription check error:', err);
    next(); // don't block on error
  }
};

module.exports = checkSubscription;
