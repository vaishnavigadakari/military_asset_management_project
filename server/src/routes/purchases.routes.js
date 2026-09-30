const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles, enforceBaseScope } = require('../middleware/rbac');
const { logAudit } = require('../middleware/auditLogger');

// GET /api/purchases
router.get('/', authenticateToken, async (req, res) => {
  try {
    let { startDate, endDate, baseId, equipmentTypeId, search } = req.query;

    let query = `
      SELECT p.id, p.purchase_ref, p.purchase_date, p.quantity, p.unit_cost, p.total_cost, p.supplier,
             b.id as base_id, b.name as base_name, b.code as base_code,
             a.id as asset_id, a.name as asset_name, a.model_code,
             et.id as equipment_type_id, et.name as equipment_type_name,
             u.full_name as created_by_name, u.rank_title
      FROM purchases p
      JOIN bases b ON p.base_id = b.id
      JOIN assets a ON p.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'Admin' && req.user.base_id) {
      query += ' AND p.base_id = ?';
      params.push(req.user.base_id);
    } else if (baseId && baseId !== 'all') {
      query += ' AND p.base_id = ?';
      params.push(baseId);
    }

    if (startDate) { query += ' AND p.purchase_date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND p.purchase_date <= ?'; params.push(endDate + ' 23:59:59'); }
    if (equipmentTypeId && equipmentTypeId !== 'all') { query += ' AND et.id = ?'; params.push(equipmentTypeId); }
    if (search) {
      query += ' AND (p.purchase_ref LIKE ? OR a.name LIKE ? OR p.supplier LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY p.purchase_date DESC';

    const purchases = await db.all(query, ...params);
    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Failed to fetch purchases history.', error: error.message });
  }
});

// POST /api/purchases
router.post('/', authenticateToken, authorizeRoles('Admin', 'Base Commander', 'Logistics Officer'), enforceBaseScope, async (req, res) => {
  const { base_id, asset_id, quantity, unit_cost, supplier, purchase_date } = req.body;

  if (!base_id || !asset_id || !quantity || !supplier) {
    return res.status(400).json({ message: 'Base, Asset, Quantity, and Supplier are required.' });
  }

  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive integer.' });
  }

  let cost = parseFloat(unit_cost);
  if (isNaN(cost) || cost < 0) {
    const asset = await db.get('SELECT unit_cost FROM assets WHERE id = ?', asset_id);
    cost = asset ? asset.unit_cost : 0;
  }

  const totalCost = parsedQty * cost;
  const pDate = purchase_date || new Date().toISOString().replace('T', ' ').substring(0, 19);

  const countObj = await db.get('SELECT COUNT(*) as cnt FROM purchases');
  const count = (countObj ? countObj.cnt : 0) + 1;
  const purchaseRef = `PUR-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  try {
    const insertRes = await db.run(`
      INSERT INTO purchases (purchase_ref, base_id, asset_id, quantity, unit_cost, total_cost, supplier, purchase_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, purchaseRef, base_id, asset_id, parsedQty, cost, totalCost, supplier, pDate, req.user.id);

    const purchaseId = insertRes.lastInsertRowid;

    // Update or Create Inventory
    const inv = await db.get('SELECT id, current_stock FROM inventory WHERE base_id = ? AND asset_id = ?', base_id, asset_id);
    if (inv) {
      await db.run('UPDATE inventory SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', parsedQty, inv.id);
    } else {
      await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, 0, ?)', base_id, asset_id, parsedQty);
    }

    await logAudit(req, 'RECORD_PURCHASE', 'purchases', purchaseRef, base_id, {
      asset_id,
      quantity: parsedQty,
      unit_cost: cost,
      total_cost: totalCost,
      supplier
    });

    const newRecord = await db.get(`
      SELECT p.*, b.name as base_name, a.name as asset_name, et.name as equipment_type_name
      FROM purchases p
      JOIN bases b ON p.base_id = b.id
      JOIN assets a ON p.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      WHERE p.id = ?
    `, purchaseId);

    res.status(201).json({
      message: 'Asset purchase recorded successfully.',
      purchase: newRecord
    });
  } catch (error) {
    console.error('Error recording purchase:', error);
    res.status(500).json({ message: 'Failed to record asset purchase.', error: error.message });
  }
});

module.exports = router;
