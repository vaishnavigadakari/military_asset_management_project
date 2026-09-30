const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { logAudit } = require('../middleware/auditLogger');

// GET /api/transfers
router.get('/', authenticateToken, async (req, res) => {
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

    if (req.user.role !== 'Admin' && req.user.base_id) {
      query += ' AND (t.from_base_id = ? OR t.to_base_id = ?)';
      params.push(req.user.base_id, req.user.base_id);
    } else if (baseId && baseId !== 'all') {
      query += ' AND (t.from_base_id = ? OR t.to_base_id = ?)';
      params.push(baseId, baseId);
    }

    if (startDate) { query += ' AND t.transfer_date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND t.transfer_date <= ?'; params.push(endDate + ' 23:59:59'); }
    if (status && status !== 'all') { query += ' AND t.status = ?'; params.push(status); }
    if (equipmentTypeId && equipmentTypeId !== 'all') { query += ' AND et.id = ?'; params.push(equipmentTypeId); }
    if (search) {
      query += ' AND (t.transfer_ref LIKE ? OR a.name LIKE ? OR fb.name LIKE ? OR tb.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY t.transfer_date DESC';

    const transfers = await db.all(query, ...params);
    res.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ message: 'Failed to fetch transfers history.', error: error.message });
  }
});

// POST /api/transfers
router.post('/', authenticateToken, authorizeRoles('Admin', 'Base Commander', 'Logistics Officer'), async (req, res) => {
  const { from_base_id, to_base_id, asset_id, quantity, notes, status, transfer_date } = req.body;

  if (!from_base_id || !to_base_id || !asset_id || !quantity) {
    return res.status(400).json({ message: 'Origin Base, Destination Base, Asset, and Quantity are required.' });
  }

  if (parseInt(from_base_id, 10) === parseInt(to_base_id, 10)) {
    return res.status(400).json({ message: 'Origin base and Destination base cannot be the same base.' });
  }

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

  const countObj = await db.get('SELECT COUNT(*) as cnt FROM transfers');
  const count = (countObj ? countObj.cnt : 0) + 1;
  const transferRef = `TRF-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  try {
    const insertRes = await db.run(`
      INSERT INTO transfers (transfer_ref, from_base_id, to_base_id, asset_id, quantity, status, transfer_date, notes, initiated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, transferRef, from_base_id, to_base_id, asset_id, parsedQty, transferStatus, tDate, notes || '', req.user.id);

    const transferId = insertRes.lastInsertRowid;

    if (transferStatus === 'Completed') {
      await db.run('UPDATE inventory SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE base_id = ? AND asset_id = ?', parsedQty, from_base_id, asset_id);

      const destInv = await db.get('SELECT id FROM inventory WHERE base_id = ? AND asset_id = ?', to_base_id, asset_id);
      if (destInv) {
        await db.run('UPDATE inventory SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', parsedQty, destInv.id);
      } else {
        await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, 0, ?)', to_base_id, asset_id, parsedQty);
      }
    }

    await logAudit(req, 'EXECUTE_TRANSFER', 'transfers', transferRef, from_base_id, {
      from_base_id, to_base_id, asset_id, quantity: parsedQty, status: transferStatus
    });

    const newRecord = await db.get(`
      SELECT t.*, fb.name as from_base_name, tb.name as to_base_name, a.name as asset_name, et.name as equipment_type_name
      FROM transfers t
      JOIN bases fb ON t.from_base_id = fb.id
      JOIN bases tb ON t.to_base_id = tb.id
      JOIN assets a ON t.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      WHERE t.id = ?
    `, transferId);

    res.status(201).json({ message: 'Asset transfer executed successfully.', transfer: newRecord });
  } catch (error) {
    console.error('Error executing transfer:', error);
    res.status(500).json({ message: 'Failed to process asset transfer.', error: error.message });
  }
});

// PATCH /api/transfers/:id/status
router.patch('/:id/status', authenticateToken, authorizeRoles('Admin', 'Base Commander', 'Logistics Officer'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Completed', 'In Transit', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status update value.' });
  }

  const existing = await db.get('SELECT * FROM transfers WHERE id = ?', id);
  if (!existing) {
    return res.status(404).json({ message: 'Transfer record not found.' });
  }

  if (existing.status === 'Completed' && status !== 'Completed') {
    return res.status(400).json({ message: 'Completed transfers cannot be reverted.' });
  }

  try {
    await db.run('UPDATE transfers SET status = ? WHERE id = ?', status, id);

    if (status === 'Completed' && existing.status !== 'Completed') {
      await db.run('UPDATE inventory SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE base_id = ? AND asset_id = ?', existing.quantity, existing.from_base_id, existing.asset_id);

      const destInv = await db.get('SELECT id FROM inventory WHERE base_id = ? AND asset_id = ?', existing.to_base_id, existing.asset_id);
      if (destInv) {
        await db.run('UPDATE inventory SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', existing.quantity, destInv.id);
      } else {
        await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, 0, ?)', existing.to_base_id, existing.asset_id, existing.quantity);
      }
    }

    await logAudit(req, 'UPDATE_TRANSFER_STATUS', 'transfers', existing.transfer_ref, existing.from_base_id, {
      previous_status: existing.status, new_status: status
    });

    res.json({ message: `Transfer status updated to ${status}.` });
  } catch (error) {
    console.error('Error updating transfer status:', error);
    res.status(500).json({ message: 'Failed to update transfer status.', error: error.message });
  }
});

module.exports = router;
