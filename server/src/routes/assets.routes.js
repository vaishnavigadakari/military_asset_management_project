const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/assets/types - List equipment categories
router.get('/types', authenticateToken, (req, res) => {
  try {
    const types = db.prepare('SELECT * FROM equipment_types ORDER BY name ASC').all();
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch equipment types.', error: error.message });
  }
});

// GET /api/assets - List all equipment assets
router.get('/', authenticateToken, (req, res) => {
  try {
    const { equipmentTypeId } = req.query;
    let query = `
      SELECT a.*, et.name as equipment_type_name, et.unit_of_measure
      FROM assets a
      JOIN equipment_types et ON a.equipment_type_id = et.id
      WHERE 1=1
    `;
    const params = [];
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      query += ' AND a.equipment_type_id = ?';
      params.push(equipmentTypeId);
    }
    query += ' ORDER BY a.name ASC';

    const assets = db.prepare(query).all(...params);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assets.', error: error.message });
  }
});

// GET /api/assets/inventory - Get current stock across bases
router.get('/inventory', authenticateToken, (req, res) => {
  try {
    let { baseId, equipmentTypeId } = req.query;

    let query = `
      SELECT inv.id, inv.opening_balance, inv.current_stock, inv.updated_at,
             b.id as base_id, b.name as base_name, b.code as base_code,
             a.id as asset_id, a.name as asset_name, a.model_code, a.unit_cost,
             et.id as equipment_type_id, et.name as equipment_type_name, et.unit_of_measure
      FROM inventory inv
      JOIN bases b ON inv.base_id = b.id
      JOIN assets a ON inv.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'Admin' && req.user.base_id) {
      query += ' AND inv.base_id = ?';
      params.push(req.user.base_id);
    } else if (baseId && baseId !== 'all') {
      query += ' AND inv.base_id = ?';
      params.push(baseId);
    }

    if (equipmentTypeId && equipmentTypeId !== 'all') {
      query += ' AND et.id = ?';
      params.push(equipmentTypeId);
    }

    query += ' ORDER BY b.name ASC, a.name ASC';

    const inventory = db.prepare(query).all(...params);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch inventory balance.', error: error.message });
  }
});

module.exports = router;
