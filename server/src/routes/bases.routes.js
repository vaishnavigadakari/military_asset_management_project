const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/bases - List all bases
router.get('/', authenticateToken, (req, res) => {
  try {
    const bases = db.prepare('SELECT * FROM bases ORDER BY name ASC').all();
    res.json(bases);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch military bases.', error: error.message });
  }
});

module.exports = router;
