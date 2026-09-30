const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles, enforceBaseScope } = require('../middleware/rbac');
const { logAudit } = require('../middleware/auditLogger');

// GET /api/purchases - List historical purchases
router.get('/', authenticateToken, (req, res) => {
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

    // Base scoping for non-admin
    if (req.user.role !== 'Admin' && req.user.base_id) {
      query += ' AND p.base_id = ?';
      params.push(req.user.base_id);
    } else if (baseId && baseId !== 'all') {
      query += ' AND p.base_id = ?';
      params.push(baseId);
    }

    if (startDate) {
      query += ' AND p.purchase_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND p.purchase_date <= ?';
      params.push(endDate + ' 23:59:59');
    }
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      query += ' AND et.id = ?';
      params.push(equipmentTypeId);
    }
    if (search) {
      query += ' AND (p.purchase_ref LIKE ? OR a.name LIKE ? OR p.supplier LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY p.purchase_date DESC';

    const purchases = db.prepare(query).all(...params);
    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Failed to fetch purchases history.', error: error.message });
  }
});

// POST /api/purchases - Record new purchase
router.post('/', authenticateToken, authorizeRoles('Admin', 'Base Commander', 'Logistics Officer'), enforceBaseScope, (req, res) => {
  const { base_id, asset_id, quantity, unit_cost, supplier, purchase_date } = req.body;

  if (!base_id || !asset_id || !quantity || !supplier) {
    return res.status(400).json({ message: 'Base, Asset, Quantity, and Supplier are required.' });
  }

  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive integer.' });
  }

  // Get asset unit cost if not provided
  let cost = parseFloat(unit_cost);
  if (isNaN(cost) || cost < 0) {
    const asset = db.prepare('SELECT unit_cost FROM assets WHERE id = ?').get(asset_id);
    cost = asset ? asset.unit_cost : 0;
  }

  const totalCost = parsedQty * cost;
  const pDate = purchase_date || new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Generate unique purchase reference
  const count = db.prepare('SELECT COUNT(*) as cnt FROM purchases').get().cnt + 1;
  const purchaseRef = `PUR-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const transaction = db.transaction(() => {
    // 1. Insert Purchase Record
    const insertStmt = db.prepare(`
      INSERT INTO purchases (purchase_ref, base_id, asset_id, quantity, unit_cost, total_cost, supplier, purchase_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insertStmt.run(purchaseRef, base_id, asset_id, parsedQty, cost, totalCost, supplier, pDate, req.user.id);

    // 2. Update or Create Inventory Record
    const inv = db.prepare('SELECT id, current_stock FROM inventory WHERE base_id = ? AND asset_id = ?').get(base_id, asset_id);
    if (inv) {
      db.prepare('UPDATE inventory SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(parsedQty, inv.id);
    } else {
      db.prepare('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, 0, ?)')
        .run(base_id, asset_id, parsedQty);
    }

    return result.lastInsertRowid;
  });

  try {
    const purchaseId = transaction();

    // Log Audit
    logAudit(req, 'RECORD_PURCHASE', 'purchases', purchaseRef, base_id, {
      asset_id,
      quantity: parsedQty,
      unit_cost: cost,
      total_cost: totalCost,
      supplier
    });

    const newRecord = db.prepare(`
      SELECT p.*, b.name as base_name, a.name as asset_name, et.name as equipment_type_name
      FROM purchases p
      JOIN bases b ON p.base_id = b.id
      JOIN assets a ON p.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      WHERE p.id = ?
    `).get(purchaseId);

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
