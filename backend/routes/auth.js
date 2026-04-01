// backend/routes/auth.js
// Public routes — no auth middleware needed
// POST /api/auth/register  → Create tenant + admin user
// POST /api/auth/login     → Verify credentials, return JWT
//
// Schema fixes applied:
//   - users.first_name + last_name  (replaces users.name)
//   - users.role_id FK → roles.name (replaces users.role ENUM)
//   - users.is_active check added

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../db');
const router = express.Router();

// ─── Email Transporter (for failed login security alerts) ─────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,          // false for port 587 (STARTTLS), true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS   // Gmail App Password
  }
});

// ── Verify on startup ──────────────────────────────────────────
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Mailer config error:', error.message);
  } else {
    console.log('✅ Mailer ready to send');
  }
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Body: { org_name, plan, admin_name, admin_email, admin_password }
router.post('/register', async (req, res) => {
  const {
    org_name, plan, admin_name, admin_email, admin_password,
    secondary_email, phone, two_factor_enabled
  } = req.body;

  if (!org_name || !admin_email || !admin_password || !admin_name) {
    return res.status(400).json({ success: false, error: 'All required fields must be filled.' });
  }

  // Validate secondary email ≠ company email
  if (secondary_email && secondary_email.toLowerCase() === admin_email.toLowerCase()) {
    return res.status(400).json({ success: false, error: 'Secondary email must be different from your work email.' });
  }

  // Validate phone format (basic)
  if (phone && !/^[+]?[\d\s\-()]{7,15}$/.test(phone)) {
    return res.status(400).json({ success: false, error: 'Invalid phone number format.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT user_id FROM users WHERE email=?', [admin_email]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, error: 'Email already registered.' });
    }

    const [tenantResult] = await conn.query(
      'INSERT INTO tenants (name, plan) VALUES (?, ?)',
      [org_name, plan || 'free']
    );
    const tenant_id = tenantResult.insertId;

    const nameParts = admin_name.trim().split(' ');
    const first_name = nameParts[0] || admin_name;
    const last_name = nameParts.slice(1).join(' ') || '';
    const password_hash = await bcrypt.hash(admin_password, 12);

    const [userResult] = await conn.query(
      `INSERT INTO users
         (tenant_id, role_id, first_name, last_name, email, password_hash,
          secondary_email, phone, two_factor_enabled, is_active)
       VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [tenant_id, first_name, last_name, admin_email, password_hash,
        secondary_email || null, phone || null, two_factor_enabled ? 1 : 0]
    );

    await conn.query(
      `INSERT INTO analytics_summary
         (tenant_id, total_projects, active_projects, total_tasks,
          completed_tasks, pending_tasks, inprogress_tasks, total_teams, total_employees)
       VALUES (?, 0,0,0,0,0,0,0,0)`,
      [tenant_id]
    );

    await conn.commit();
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { tenant_id, user_id: userResult.insertId, role: 'admin' }
    });
  } catch (err) {
    await conn.rollback();
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Registration failed.' });
  } finally {
    conn.release();
  }
});


// ─── POST /api/auth/forgot-password ──────────────────────────
// Send reset link to secondary_email or phone (phone = log for now)
router.post('/forgot-password', async (req, res) => {
  const { work_email, identifier } = req.body;

  if (!work_email || !identifier) {
    return res.status(400).json({
      success: false,
      error: 'Please enter both your work email and secondary email/phone.'
    });
  }

  try {
    // ✅ Both work_email AND secondary/phone must belong to the same user
    const [users] = await db.query(
      `SELECT user_id, email, secondary_email, phone,
              CONCAT(first_name,' ',last_name) AS name
       FROM users
       WHERE email = ?
         AND (secondary_email = ? OR phone = ?)
         AND is_active = 1`,
      [work_email.toLowerCase(), identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No account found. Make sure your work email and secondary contact match.'
      });
    }

    const user = users[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await db.query(
      'UPDATE users SET reset_token=?, reset_token_expiry=? WHERE user_id=?',
      [otp, expiry, user.user_id]
    );

    // Send to secondary email
    if (user.secondary_email && user.secondary_email === identifier) {
      try {
        await transporter.sendMail({
          from: `"ProjexPM Security" <${process.env.EMAIL_USER}>`,
          to: user.secondary_email,
          subject: '🔐 Password Reset OTP — ProjexPM',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto">
              <h2 style="color:#01696f">Password Reset OTP</h2>
              <p>Hi ${user.name},</p>
              <p>Your OTP code is:</p>
              <div style="font-size:42px;font-weight:800;letter-spacing:10px;color:#01696f;padding:16px 0">${otp}</div>
              <p>This code expires in <strong>15 minutes</strong>.</p>
              <p style="color:#999;font-size:12px">If you didn't request this, ignore this email.</p>
            </div>
          `
        });
        console.log('✅ OTP sent to:', user.secondary_email);
      } catch (e) {
        console.error('❌ Email failed:', e.message);
        return res.status(500).json({ success: false, error: 'Failed to send OTP. Please try again.' });
      }
    }

    // Send to phone (Twilio/MSG91)
    if (user.phone && user.phone === identifier) {
      console.log(`📱 SMS OTP for ${user.phone}: ${otp}`);
      // TODO: Twilio integration
    }

    res.json({
      success: true,
      message: `OTP sent to ${identifier.includes('@') ? identifier : 'your phone number'}.`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});



// ─── POST /api/auth/reset-password ───────────────────────────
router.post('/reset-password', async (req, res) => {
  const { identifier, otp, new_password } = req.body;

  if (!identifier || !otp || !new_password) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
  }

  try {
    const [users] = await db.query(
      `SELECT user_id, reset_token, reset_token_expiry
       FROM users
       WHERE (secondary_email=? OR phone=?)
         AND reset_token=?
         AND reset_token_expiry > NOW()`,
      [identifier, identifier, otp]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP. Please try again.' });
    }

    const user = users[0];
    const password_hash = await bcrypt.hash(new_password, 12);

    await db.query(
      'UPDATE users SET password_hash=?, reset_token=NULL, reset_token_expiry=NULL WHERE user_id=?',
      [password_hash, user.user_id]
    );

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
});


// ─── POST /api/auth/verify-2fa ────────────────────────────────
// Called after login if user has 2FA enabled — verify OTP
router.post('/verify-2fa', async (req, res) => {
  const { user_id, otp } = req.body;
  try {
    const [[user]] = await db.query(
      `SELECT user_id, reset_token, reset_token_expiry, tenant_id,
              CONCAT(first_name,' ',last_name) AS name, email,
              r.name AS role, t.name AS org_name, t.plan
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       JOIN tenants t ON u.tenant_id = t.tenant_id
       WHERE u.user_id=? AND reset_token=? AND reset_token_expiry > NOW()`,
      [user_id, otp]
    );

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired 2FA code.' });
    }

    // Clear the OTP
    await db.query('UPDATE users SET reset_token=NULL, reset_token_expiry=NULL WHERE user_id=?', [user_id]);

    const token = jwt.sign(
      { user_id: user.user_id, tenant_id: user.tenant_id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: '2FA verified.',
      data: { token, user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role, org_name: user.org_name, plan: user.plan } }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: '2FA verification failed.' });
  }

  // Split full name into first + last
  const nameParts = admin_name.trim().split(' ');
  const first_name = nameParts[0] || admin_name;
  const last_name = nameParts.slice(1).join(' ') || '';

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Check if email already registered
    const [existing] = await conn.query(
      'SELECT user_id FROM users WHERE email = ?',
      [admin_email]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, error: 'Email already registered.' });
    }

    // 2. Create tenant
    const [tenantResult] = await conn.query(
      'INSERT INTO tenants (name, plan) VALUES (?, ?)',
      [org_name, plan || 'free']
    );
    const tenant_id = tenantResult.insertId;

    // 3. Hash password (12 rounds)
    const password_hash = await bcrypt.hash(admin_password, 12);

    // 4. Insert admin user (role_id = 1 → 'admin' from roles table)
    const [userResult] = await conn.query(
      `INSERT INTO users (tenant_id, role_id, first_name, last_name, email, password_hash, is_active)
       VALUES (?, 1, ?, ?, ?, ?, 1)`,
      [tenant_id, first_name, last_name, admin_email, password_hash]
    );

    // 5. Initialize analytics_summary for this tenant
    await conn.query(
      `INSERT INTO analytics_summary
         (tenant_id, total_projects, active_projects, total_tasks,
          completed_tasks, pending_tasks, inprogress_tasks, total_teams, total_employees)
       VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0)`,
      [tenant_id]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Organisation registered successfully.',
      data: {
        tenant_id,
        user_id: userResult.insertId,
        role: 'admin',
      },
    });

  } catch (err) {
    await conn.rollback();
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  } finally {
    conn.release();
  }
});


// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Body: { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    // JOIN roles table to get role name since users stores role_id FK
    const [rows] = await db.query(
      `SELECT
         u.user_id,
         u.tenant_id,
         CONCAT(u.first_name, ' ', u.last_name) AS name,
         u.email,
         u.password_hash,
         u.is_active,
         r.name  AS role,
         t.name  AS org_name,
         t.plan
       FROM users u
       JOIN tenants t ON u.tenant_id = t.tenant_id
       JOIN roles   r ON u.role_id   = r.role_id
       WHERE u.email = ?`,
      [email]
    );

    // 1. User not found
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const user = rows[0];

    // 2. Account deactivated
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated. Please contact your admin.',
      });
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      // Send security alert email (non-blocking — failure is logged but doesn't break login)
      try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: '⚠️ Failed Login Attempt — ProjexPM',
            html: `
              <p>A failed login attempt was detected on your ProjexPM account.</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
              <p>If this was not you, please reset your password immediately.</p>
            `,
          });
        }
      } catch (mailErr) {
        console.warn('Security alert email failed (non-critical):', mailErr.message);
      }

      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Inside POST /api/auth/login — after bcrypt.compare succeeds, before signing JWT:

    if (user.two_factor_enabled) {
      // Generate OTP and send to secondary email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      await db.query(
        'UPDATE users SET reset_token=?, reset_token_expiry=? WHERE user_id=?',
        [otp, expiry, user.user_id]
      );

      try {
        if (user.secondary_email) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.secondary_email,
            subject: '🔐 Your 2FA Login Code — ProjexPM',
            html: `<h2>Two-Factor Authentication</h2>
               <p>Your login verification code is:</p>
               <h1 style="letter-spacing:8px;color:#01696f;font-size:48px">${otp}</h1>
               <p>Expires in <strong>10 minutes</strong>.</p>`
          });
        }
      } catch (e) { console.warn('2FA email failed:', e.message); }

      return res.json({
        success: true,
        requires_2fa: true,
        user_id: user.user_id,
        message: 'A 2FA verification code has been sent to your secondary email.'
      });
    }
    // If 2FA not enabled, continue to sign JWT normally...


    // 4. Sign JWT — role comes from the roles table join
    const token = jwt.sign(
      {
        user_id: user.user_id,
        tenant_id: user.tenant_id,
        role: user.role,    // 'admin' | 'manager' | 'employee'
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 5. Return success
    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: {
        token,
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          org_name: user.org_name,
          plan: user.plan,
        },
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
});


module.exports = router;