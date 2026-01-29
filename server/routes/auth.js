const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const config = require('../config');
const { authRequired } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

const ensureVerificationTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      code_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      consumed TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (email)
    )
  `);
};

const ensurePasswordResetTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      consumed TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX (token_hash)
    )
  `);
};

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax'
};

function buildToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.full_name, role: user.role },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  const { email, password, fullName, role, code } = req.body;
  if (!email || !password || !fullName || !code) {
    return res.status(400).json({ message: 'Please provide email, password, full name, and verification code' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.toString().trim();
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  await ensureVerificationTable();
  const normalizedRole = role === 'recruiter' ? 'recruiter' : 'candidate';
  try {
    console.log('[register] input', { email: normalizedEmail, code: normalizedCode });
    const existing = await query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const verifications = await query(
      'SELECT * FROM email_verifications WHERE email = ? AND consumed = 0 AND expires_at > UTC_TIMESTAMP() ORDER BY created_at DESC LIMIT 5',
      [normalizedEmail]
    );
    console.log('[register] fetched verifications', verifications.map((v) => ({ id: v.id, expires_at: v.expires_at, consumed: v.consumed })));
    if (!verifications.length) {
      const raw = await query('SELECT id, expires_at, consumed, created_at FROM email_verifications WHERE email = ? ORDER BY created_at DESC LIMIT 5', [normalizedEmail]);
      console.log('[register] raw lookback', raw);
      const nowRow = await query('SELECT UTC_TIMESTAMP() AS now_ts');
      console.log('[register] server UTC_TIMESTAMP()', nowRow);
    }
    let matched;
    for (const row of verifications) {
      console.log('[register] compare', { rowId: row.id, expires_at: row.expires_at, consumed: row.consumed });
      const match = await bcrypt.compare(normalizedCode, row.code_hash);
      if (match) {
        matched = row;
        break;
      }
    }
    if (!matched) {
      console.log('[register] no matching code', { email: normalizedEmail, code: normalizedCode });
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [normalizedEmail, passwordHash, fullName, normalizedRole]
    );
    await query('UPDATE email_verifications SET consumed = 1 WHERE id = ?', [matched.id]);
    const user = {
      id: result.insertId,
      email,
      full_name: fullName,
      role: normalizedRole
    };
    const token = buildToken(user);
    res.cookie('token', token, cookieOptions);
    return res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to register user' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }
  try {
    const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const token = buildToken(user);
    res.cookie('token', token, cookieOptions);
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ message: 'Logged out' });
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Enter a valid email' });
  }
  try {
    await ensurePasswordResetTable();
    const users = await query('SELECT id, email, full_name FROM users WHERE email = ?', [normalizedEmail]);
    if (!users.length) {
      return res.json({ message: 'If the email exists, a reset link will be provided below.' });
    }
    const user = users[0];
    const token = uuidv4();
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresRow = (await query('SELECT DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE) AS expires_at'))[0];
    await query(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE))',
      [user.id, tokenHash]
    );

    const clientBase = config.clientOrigin[0] || 'http://localhost:3000';
    const resetUrl = `${clientBase.replace(/\/$/, '')}/reset?token=${encodeURIComponent(token)}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your CATaur password',
        text: `Hi ${user.full_name || 'there'},\n\nWe received a password reset request. Use the link below within 30 minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Hi ${user.full_name || 'there'},</p><p>We received a password reset request. Use the link below within 30 minutes:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`
      });
    } catch (mailErr) {
      console.error('[forgot] email send failed', mailErr);
    }

    // For sandbox/QA, return the token so it can be pasted into the reset form.
    return res.json({
      message: 'If the email exists, we sent a reset link. Check your inbox.',
      token,
      expiresAt: expiresRow.expires_at
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to create reset token' });
  }
});

router.post('/reset', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  try {
    const resets = await query(
      'SELECT pr.*, u.email FROM password_resets pr JOIN users u ON pr.user_id = u.id WHERE pr.consumed = 0 AND pr.expires_at > UTC_TIMESTAMP() ORDER BY pr.created_at DESC'
    );
    let matched;
    for (const row of resets) {
      const match = await bcrypt.compare(token, row.token_hash);
      if (match) {
        matched = row;
        break;
      }
    }
    if (!matched) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, matched.user_id]);
    await query('UPDATE password_resets SET consumed = 1 WHERE id = ?', [matched.id]);
    return res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

router.post('/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Enter a valid email' });
  }
  await ensureVerificationTable();
  try {
    console.log('[send-code] request', { email: normalizedEmail });
    const existing = await query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await query(
      'INSERT INTO email_verifications (email, code_hash, expires_at, consumed) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE), 0)',
      [normalizedEmail, codeHash]
    );
    console.log('[send-code] stored', { email: normalizedEmail, code, expiresAt: expiresAt.toISOString() });
    await sendEmail({
      to: normalizedEmail,
      subject: 'Your CATaur verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`
    });
    return res.json({ message: 'Verification code sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to send verification code' });
  }
});

module.exports = router;
