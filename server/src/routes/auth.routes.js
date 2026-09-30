const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = db.prepare(`
    SELECT u.*, b.name as base_name, b.code as base_code
    FROM users u
    LEFT JOIN bases b ON u.base_id = b.id
    WHERE u.username = ?
  `).get(username);

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
});

// Current User Info
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.username, u.full_name, u.role, u.base_id, u.rank_title, b.name as base_name
    FROM users u
    LEFT JOIN bases b ON u.base_id = b.id
    WHERE u.id = ?
  `).get(req.user.id);

  res.json(user);
});

// List all users (for administrative role switching / simulation)
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.full_name, u.role, u.base_id, u.rank_title, b.name as base_name
    FROM users u
    LEFT JOIN bases b ON u.base_id = b.id
    ORDER BY u.id ASC
  `).all();

  res.json(users);
});

module.exports = router;
