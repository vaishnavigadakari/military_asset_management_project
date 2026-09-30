const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/audit - Fetch transaction audit log history
router.get('/', authenticateToken, (req, res) => {
  try {
    let { limit, baseId, action } = req.query;
    const max = parseInt(limit, 10) || 50;

    let query = `
      SELECT al.*, b.name as base_name
      FROM audit_logs al
      LEFT JOIN bases b ON al.base_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'Admin' && req.user.base_id) {
      query += ' AND (al.base_id = ? OR al.base_id IS NULL)';
      params.push(req.user.base_id);
    } else if (baseId && baseId !== 'all') {
      query += ' AND al.base_id = ?';
      params.push(baseId);
    }

    if (action && action !== 'all') {
      query += ' AND al.action = ?';
      params.push(action);
    }

    query += ' ORDER BY al.timestamp DESC LIMIT ?';
    params.push(max);

    const logs = db.prepare(query).all(...params);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit log history.', error: error.message });
  }
});

module.exports = router;
