const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const bcrypt   = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// ── GET /api/profile ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [[user]] = await db.query(
      `SELECT
         u.user_id, u.first_name, u.last_name, u.email,
         u.secondary_email, u.phone, u.avatar_url, u.bio,
         u.department, u.job_title, u.location, u.timezone,
         u.date_of_birth, u.gender, u.linkedin_url,
         u.two_factor_enabled, u.notification_email,
         u.notification_sms, u.theme_preference,
         u.is_active, u.created_at,
         r.name AS role,
         t.name AS org_name, t.plan
       FROM users u
       JOIN roles r  ON u.role_id  = r.role_id
       JOIN tenants t ON u.tenant_id = t.tenant_id
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch profile.' });
  }
});

// ── PUT /api/profile ─── Update basic info ───────────────────
router.put('/', async (req, res) => {
  const {
    first_name, last_name, bio, department, job_title,
    location, timezone, date_of_birth, gender,
    linkedin_url, notification_email, notification_sms, theme_preference
  } = req.body;

  if (!first_name?.trim() || !last_name?.trim()) {
    return res.status(400).json({ success: false, error: 'First and last name are required.' });
  }

  try {
    await db.query(
      `UPDATE users SET
         first_name=?, last_name=?, bio=?, department=?,
         job_title=?, location=?, timezone=?, date_of_birth=?,
         gender=?, linkedin_url=?, notification_email=?,
         notification_sms=?, theme_preference=?
       WHERE user_id=?`,
      [
        first_name.trim(), last_name.trim(), bio || null,
        department || null, job_title || null, location || null,
        timezone || 'Asia/Kolkata', date_of_birth || null,
        gender || null, linkedin_url || null,
        notification_email ? 1 : 0, notification_sms ? 1 : 0,
        theme_preference || 'system', req.user.user_id
      ]
    );
    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

// ── PUT /api/profile/security ─── Update secondary email, phone, 2FA ──
router.put('/security', async (req, res) => {
  const { secondary_email, phone, two_factor_enabled } = req.body;
  const { email: work_email } = req.user;

  if (secondary_email && secondary_email.toLowerCase() === work_email.toLowerCase()) {
    return res.status(400).json({ success: false, error: 'Secondary email must be different from your work email.' });
  }
  if (secondary_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secondary_email)) {
    return res.status(400).json({ success: false, error: 'Invalid secondary email format.' });
  }
  if (phone && !/^[+]?[\d\s\-()]{7,15}$/.test(phone)) {
    return res.status(400).json({ success: false, error: 'Invalid phone number format.' });
  }

  try {
    await db.query(
      'UPDATE users SET secondary_email=?, phone=?, two_factor_enabled=? WHERE user_id=?',
      [secondary_email || null, phone || null, two_factor_enabled ? 1 : 0, req.user.user_id]
    );
    res.json({ success: true, message: 'Security settings updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update security settings.' });
  }
});

// ── PUT /api/profile/password ─── Change password ────────────
router.put('/password', async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password || !confirm_password) {
    return res.status(400).json({ success: false, error: 'All password fields are required.' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ success: false, error: 'New password must be at least 8 characters.' });
  }
  if (new_password !== confirm_password) {
    return res.status(400).json({ success: false, error: 'New passwords do not match.' });
  }

  try {
    const [[user]] = await db.query('SELECT password_hash FROM users WHERE user_id=?', [req.user.user_id]);
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(400).json({ success: false, error: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE users SET password_hash=? WHERE user_id=?', [hash, req.user.user_id]);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to change password.' });
  }
});

module.exports = router;
