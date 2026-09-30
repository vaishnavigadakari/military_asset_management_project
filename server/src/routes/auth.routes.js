const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await db.get(`
      SELECT u.*, b.name as base_name, b.code as base_code
      FROM users u
      LEFT JOIN bases b ON u.base_id = b.id
      WHERE u.username = ?
    `, username);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      base_id: user.base_id,
      base_name: user.base_name,
      rank_title: user.rank_title
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'mams_secure_military_jwt_token_key_2026', {
      expiresIn: '24h'
    });

    res.json({
      token,
      user: payload
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

// Current User Info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(`
      SELECT u.id, u.username, u.full_name, u.role, u.base_id, u.rank_title, b.name as base_name
      FROM users u
      LEFT JOIN bases b ON u.base_id = b.id
      WHERE u.id = ?
    `, req.user.id);

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user context.', error: error.message });
  }
});

// List all users
router.get('/users', async (req, res) => {
  try {
    const users = await db.all(`
      SELECT u.id, u.username, u.full_name, u.role, u.base_id, u.rank_title, b.name as base_name
      FROM users u
      LEFT JOIN bases b ON u.base_id = b.id
      ORDER BY u.id ASC
    `);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users list.', error: error.message });
  }
});

module.exports = router;
