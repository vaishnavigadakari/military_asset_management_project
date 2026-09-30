const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { logAudit } = require('../middleware/auditLogger');

// GET /api/transfers - List asset transfers with filters
router.get('/', authenticateToken, (req, res) => {
  try {
    let { startDate, endDate, baseId, status, equipmentTypeId, search } = req.query;

    let query = `
      SELECT t.id, t.transfer_ref, t.transfer_date, t.quantity, t.status, t.notes,
             fb.id as from_base_id, fb.name as from_base_name, fb.code as from_base_code,
             tb.id as to_base_id, tb.name as to_base_name, tb.code as to_base_code,
             a.id as asset_id, a.name as asset_name, a.model_code,
             et.id as equipment_type_id, et.name as equipment_type_name,
             u.full_name as initiated_by_name, u.rank_title
      FROM transfers t
      JOIN bases fb ON t.from_base_id = fb.id
      JOIN bases tb ON t.to_base_id = tb.id
      JOIN assets a ON t.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      JOIN users u ON t.initiated_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Base scoping for non-admin
    if (req.user.role !== 'Admin' && req.user.base_id) {
      query += ' AND (t.from_base_id = ? OR t.to_base_id = ?)';
      params.push(req.user.base_id, req.user.base_id);
    } else if (baseId && baseId !== 'all') {
      query += ' AND (t.from_base_id = ? OR t.to_base_id = ?)';
      params.push(baseId, baseId);
    }

    if (startDate) {
      query += ' AND t.transfer_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.transfer_date <= ?';
      params.push(endDate + ' 23:59:59');
    }
    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      query += ' AND et.id = ?';
      params.push(equipmentTypeId);
    }
    if (search) {
      query += ' AND (t.transfer_ref LIKE ? OR a.name LIKE ? OR fb.name LIKE ? OR tb.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY t.transfer_date DESC';

    const transfers = db.prepare(query).all(...params);
    res.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ message: 'Failed to fetch transfers history.', error: error.message });
  }
});

// POST /api/transfers - Initiate asset transfer
router.post('/', authenticateToken, authorizeRoles('Admin', 'Base Commander', 'Logistics Officer'), (req, res) => {
  const { from_base_id, to_base_id, asset_id, quantity, notes, status, transfer_date } = req.body;

  if (!from_base_id || !to_base_id || !asset_id || !quantity) {
    return res.status(400).json({ message: 'Origin Base, Destination Base, Asset, and Quantity are required.' });
  }

  if (parseInt(from_base_id, 10) === parseInt(to_base_id, 10)) {
    return res.status(400).json({ message: 'Origin base and Destination base cannot be the same base.' });
  }

  // Base scope enforcement for non-admin
  if (req.user.role !== 'Admin' && req.user.base_id) {
    if (parseInt(from_base_id, 10) !== parseInt(req.user.base_id, 10) && parseInt(to_base_id, 10) !== parseInt(req.user.base_id, 10)) {
      return res.status(403).json({ message: 'RBAC Violation: You can only transfer assets to or from your assigned base.' });
    }
  }

  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ message: 'Transfer quantity must be a positive integer.' });
  }

  const transferStatus = status || 'Completed';
  const tDate = transfer_date || new Date().toISOString().replace('T', ' ').substring(0, 19);

  const count = db.prepare('SELECT COUNT(*) as cnt FROM transfers').get().cnt + 1;
  const transferRef = `TRF-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const transaction = db.transaction(() => {
    // 1. Insert Transfer Record
    const insertStmt = db.prepare(`
      INSERT INTO transfers (transfer_ref, from_base_id, to_base_id, asset_id, quantity, status, transfer_date, notes, initiated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insertStmt.run(transferRef, from_base_id, to_base_id, asset_id, parsedQty, transferStatus, tDate, notes || '', req.user.id);

    // 2. Adjust Stock if status is Completed
    if (transferStatus === 'Completed') {
      // Deduct from Origin
      db.prepare('UPDATE inventory SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE base_id = ? AND asset_id = ?')
        .run(parsedQty, from_base_id, asset_id);

      // Add to Destination
      const destInv = db.prepare('SELECT id FROM inventory WHERE base_id = ? AND asset_id = ?').get(to_base_id, asset_id);
      if (destInv) {
        db.prepare('UPDATE inventory SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(parsedQty, destInv.id);
      } else {
        db.prepare('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, 0, ?)')
          .run(to_base_id, asset_id, parsedQty);
      }
    }

    return result.lastInsertRowid;
  });

  try {
    const transferId = transaction();

    logAudit(req, 'EXECUTE_TRANSFER', 'transfers', transferRef, from_base_id, {
      from_base_id,
      to_base_id,
      asset_id,
      quantity: parsedQty,
      status: transferStatus
    });

    const newRecord = db.prepare(`
      SELECT t.*, fb.name as from_base_name, tb.name as to_base_name, a.name as asset_name, et.name as equipment_type_name
      FROM transfers t
      JOIN bases fb ON t.from_base_id = fb.id
      JOIN bases tb ON t.to_base_id = tb.id
      JOIN assets a ON t.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      WHERE t.id = ?
    `).get(transferId);

    res.status(201).json({
      message: 'Asset transfer executed successfully.',
      transfer: newRecord
    });
  } catch (error) {
    console.error('Error executing transfer:', error);
    res.status(500).json({ message: 'Failed to process asset transfer.', error: error.message });
  }
});

// PATCH /api/transfers/:id/status - Update transfer status
router.patch('/:id/status', authenticateToken, authorizeRoles('Admin', 'Base Commander', 'Logistics Officer'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Completed', 'In Transit', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status update value.' });
  }

  const existing = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ message: 'Transfer record not found.' });
  }

  if (existing.status === 'Completed' && status !== 'Completed') {
    return res.status(400).json({ message: 'Completed transfers cannot be reverted.' });
  }

  const transaction = db.transaction(() => {
    db.prepare('UPDATE transfers SET status = ? WHERE id = ?').run(status, id);

    if (status === 'Completed' && existing.status !== 'Completed') {
      // Deduct from Origin
      db.prepare('UPDATE inventory SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE base_id = ? AND asset_id = ?')
        .run(existing.quantity, existing.from_base_id, existing.asset_id);

      // Add to Destination
      const destInv = db.prepare('SELECT id FROM inventory WHERE base_id = ? AND asset_id = ?').get(existing.to_base_id, existing.asset_id);
      if (destInv) {
        db.prepare('UPDATE inventory SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(existing.quantity, destInv.id);
      } else {
        db.prepare('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, 0, ?)')
          .run(existing.to_base_id, existing.asset_id, existing.quantity);
      }
    }
  });

  try {
    transaction();

    logAudit(req, 'UPDATE_TRANSFER_STATUS', 'transfers', existing.transfer_ref, existing.from_base_id, {
      previous_status: existing.status,
      new_status: status
    });

    res.json({ message: `Transfer status updated to ${status}.` });
  } catch (error) {
    console.error('Error updating transfer status:', error);
    res.status(500).json({ message: 'Failed to update transfer status.', error: error.message });
  }
});

module.exports = router;
