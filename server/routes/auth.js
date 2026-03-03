const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const xss = require('xss');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ── Register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    let { name, email, phone, password, company_name, gstin } = req.body;

    // Validate
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    name = xss(name.trim());
    email = email.trim().toLowerCase();

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check existing
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const uuid = uuidv4();
    const hash = await bcrypt.hash(password, 12);

    await db.query(`
      INSERT INTO users (uuid, name, email, phone, password, company_name, gstin, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'client')
    `, [uuid, name, email, phone || null, hash, company_name ? xss(company_name) : null, gstin ? xss(gstin) : null]);

    const [newUser] = await db.query('SELECT id, uuid, name, email, role FROM users WHERE uuid = ?', [uuid]);

    const token = jwt.sign({ id: newUser[0].id, role: 'client' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { uuid: newUser[0].uuid, name: newUser[0].name, email: newUser[0].email, role: newUser[0].role }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── Login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email.trim().toLowerCase()]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.json({
      message: 'Login successful',
      token,
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        company_name: user.company_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── Get Profile ──────────────────────────────────────────────
router.get('/profile', authenticate, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT uuid, name, email, phone, role, company_name, gstin, address, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ user: users[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ── Update Profile ───────────────────────────────────────────
router.put('/profile', authenticate, async (req, res) => {
  try {
    let { name, phone, company_name, gstin, address } = req.body;
    await db.query(
      'UPDATE users SET name=?, phone=?, company_name=?, gstin=?, address=? WHERE id=?',
      [xss(name), phone, company_name ? xss(company_name) : null, gstin ? xss(gstin) : null, address ? xss(address) : null, req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── Change Password ──────────────────────────────────────────
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
