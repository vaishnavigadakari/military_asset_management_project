const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/assets/types
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const types = await db.all('SELECT * FROM equipment_types ORDER BY name ASC');
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch equipment types.', error: error.message });
  }
});

// GET /api/assets
router.get('/', authenticateToken, async (req, res) => {
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

    const assets = await db.all(query, ...params);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assets.', error: error.message });
  }
});

// GET /api/assets/inventory
router.get('/inventory', authenticateToken, async (req, res) => {
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

    const inventory = await db.all(query, ...params);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch inventory balance.', error: error.message });
  }
});

module.exports = router;
