// backend/routes/owner.js
// Super-owner route — no tenant scoping, sees ALL organisations
const express = require('express');
const db      = require('../db');
const router  = express.Router();

// GET /api/owner/organisations — all orgs with full details
// GET /api/owner/organisations
router.get('/organisations', async (req, res) => {
  try {
    const [orgs] = await db.query(
      `SELECT
         t.tenant_id,
         t.name AS org_name,
         t.plan,
         t.created_at,
         COUNT(DISTINCT u.user_id)    AS total_users,
         COUNT(DISTINCT p.project_id) AS total_projects,
         COUNT(DISTINCT tk.task_id)   AS total_tasks,
         COUNT(DISTINCT tm.team_id)   AS total_teams,
         ANY_VALUE(s.subscription_status) AS subscription_status,
         ANY_VALUE(s.current_period_end)  AS current_period_end,
         ANY_VALUE(b.total_due)           AS last_billing
       FROM tenants t
       LEFT JOIN users u
              ON u.tenant_id = t.tenant_id
       LEFT JOIN projects p
              ON p.tenant_id = t.tenant_id
       LEFT JOIN tasks tk
              ON tk.project_id = p.project_id
       LEFT JOIN teams tm
              ON tm.tenant_id = t.tenant_id
       LEFT JOIN subscriptions s
              ON s.tenant_id = t.tenant_id AND s.is_active = 1
       LEFT JOIN billing_summary b
              ON b.tenant_id = t.tenant_id
       GROUP BY t.tenant_id, t.name, t.plan, t.created_at
       ORDER BY t.created_at DESC`
    );

    const [members] = await db.query(
      `SELECT u.tenant_id, u.user_id,
              CONCAT(u.first_name,' ',u.last_name) AS name,
              u.email, r.name AS role, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       ORDER BY u.tenant_id, r.role_id`
    );

    const [projects] = await db.query(
      `SELECT project_id, tenant_id, name, type, priority, status, progress, created_at
       FROM projects ORDER BY tenant_id, created_at DESC`
    );

    res.json({ success: true, data: { orgs, members, projects } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch organisations.' });
  }
});

module.exports = router;