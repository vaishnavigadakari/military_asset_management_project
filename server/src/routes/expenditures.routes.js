const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles, enforceBaseScope } = require('../middleware/rbac');
const { logAudit } = require('../middleware/auditLogger');

// GET /api/expenditures - List expenditure records
router.get('/', authenticateToken, (req, res) => {
  try {
    let { startDate, endDate, baseId, equipmentTypeId, search } = req.query;

    let query = `
      SELECT e.id, e.expenditure_ref, e.expended_date, e.quantity, e.reason,
             b.id as base_id, b.name as base_name, b.code as base_code,
             a.id as asset_id, a.name as asset_name, a.model_code,
             et.id as equipment_type_id, et.name as equipment_type_name,
             u.full_name as reported_by_name, u.rank_title
      FROM expenditures e
      JOIN bases b ON e.base_id = b.id
      JOIN assets a ON e.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      JOIN users u ON e.reported_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Base scoping for non-admin
    if (req.user.role !== 'Admin' && req.user.base_id) {
      query += ' AND e.base_id = ?';
      params.push(req.user.base_id);
    } else if (baseId && baseId !== 'all') {
      query += ' AND e.base_id = ?';
      params.push(baseId);
    }

    if (startDate) {
      query += ' AND e.expended_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND e.expended_date <= ?';
      params.push(endDate + ' 23:59:59');
    }
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      query += ' AND et.id = ?';
      params.push(equipmentTypeId);
    }
    if (search) {
      query += ' AND (e.expenditure_ref LIKE ? OR e.reason LIKE ? OR a.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY e.expended_date DESC';

    const expenditures = db.prepare(query).all(...params);
    res.json(expenditures);
  } catch (error) {
    console.error('Error fetching expenditures:', error);
    res.status(500).json({ message: 'Failed to fetch expenditures.', error: error.message });
  }
});

// POST /api/expenditures - Record expended asset
router.post('/', authenticateToken, authorizeRoles('Admin', 'Base Commander'), enforceBaseScope, (req, res) => {
  const { base_id, asset_id, quantity, reason, expended_date } = req.body;

  if (!base_id || !asset_id || !quantity || !reason) {
    return res.status(400).json({ message: 'Base, Asset, Quantity, and Reason are required.' });
  }

  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ message: 'Expended quantity must be a positive integer.' });
  }

  const eDate = expended_date || new Date().toISOString().replace('T', ' ').substring(0, 19);

  const count = db.prepare('SELECT COUNT(*) as cnt FROM expenditures').get().cnt + 1;
  const expenditureRef = `EXP-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const transaction = db.transaction(() => {
    // 1. Insert expenditure record
    const insertStmt = db.prepare(`
      INSERT INTO expenditures (expenditure_ref, base_id, asset_id, quantity, reason, expended_date, reported_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insertStmt.run(expenditureRef, base_id, asset_id, parsedQty, reason, eDate, req.user.id);

    // 2. Deduct inventory stock
    db.prepare('UPDATE inventory SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE base_id = ? AND asset_id = ?')
      .run(parsedQty, base_id, asset_id);

    return result.lastInsertRowid;
  });

  try {
    const expenditureId = transaction();

    logAudit(req, 'LOG_EXPENDITURE', 'expenditures', expenditureRef, base_id, {
      asset_id,
      quantity: parsedQty,
      reason
    });

    const newRecord = db.prepare(`
      SELECT e.*, b.name as base_name, a.name as asset_name, et.name as equipment_type_name
      FROM expenditures e
      JOIN bases b ON e.base_id = b.id
      JOIN assets a ON e.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      WHERE e.id = ?
    `).get(expenditureId);

    res.status(201).json({
      message: 'Asset expenditure logged successfully.',
      expenditure: newRecord
    });
  } catch (error) {
    console.error('Error logging expenditure:', error);
    res.status(500).json({ message: 'Failed to record expenditure.', error: error.message });
  }
});

module.exports = router;
