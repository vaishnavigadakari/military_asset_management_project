const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/bases
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bases = await db.all('SELECT * FROM bases ORDER BY name ASC');
    res.json(bases);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch military bases.', error: error.message });
  }
});

module.exports = router;
