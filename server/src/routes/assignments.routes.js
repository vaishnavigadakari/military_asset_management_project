const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles, enforceBaseScope } = require('../middleware/rbac');
const { logAudit } = require('../middleware/auditLogger');

// GET /api/assignments - List asset assignments
router.get('/', authenticateToken, (req, res) => {
  try {
    let { startDate, endDate, baseId, status, equipmentTypeId, search } = req.query;

    let query = `
      SELECT asn.id, asn.assignment_ref, asn.assigned_to_name, asn.assigned_to_service_id, asn.unit_squad,
             asn.quantity, asn.assigned_date, asn.expected_return_date, asn.status,
             b.id as base_id, b.name as base_name, b.code as base_code,
             a.id as asset_id, a.name as asset_name, a.model_code,
             et.id as equipment_type_id, et.name as equipment_type_name,
             u.full_name as assigned_by_name, u.rank_title
      FROM assignments asn
      JOIN bases b ON asn.base_id = b.id
      JOIN assets a ON asn.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      JOIN users u ON asn.assigned_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Base scoping for non-admin
    if (req.user.role !== 'Admin' && req.user.base_id) {
      query += ' AND asn.base_id = ?';
      params.push(req.user.base_id);
    } else if (baseId && baseId !== 'all') {
      query += ' AND asn.base_id = ?';
      params.push(baseId);
    }

    if (startDate) {
      query += ' AND asn.assigned_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND asn.assigned_date <= ?';
      params.push(endDate + ' 23:59:59');
    }
    if (status && status !== 'all') {
      query += ' AND asn.status = ?';
      params.push(status);
    }
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      query += ' AND et.id = ?';
      params.push(equipmentTypeId);
    }
    if (search) {
      query += ' AND (asn.assignment_ref LIKE ? OR asn.assigned_to_name LIKE ? OR asn.assigned_to_service_id LIKE ? OR a.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY asn.assigned_date DESC';

    const assignments = db.prepare(query).all(...params);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Failed to fetch asset assignments.', error: error.message });
  }
});

// POST /api/assignments - Assign asset to personnel
router.post('/', authenticateToken, authorizeRoles('Admin', 'Base Commander'), enforceBaseScope, (req, res) => {
  const { base_id, asset_id, assigned_to_name, assigned_to_service_id, unit_squad, quantity, assigned_date, expected_return_date } = req.body;

  if (!base_id || !asset_id || !assigned_to_name || !assigned_to_service_id || !quantity) {
    return res.status(400).json({ message: 'Base, Asset, Assignee Name, Service ID, and Quantity are required.' });
  }

  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ message: 'Assignment quantity must be a positive integer.' });
  }

  const aDate = assigned_date || new Date().toISOString().replace('T', ' ').substring(0, 19);

  const count = db.prepare('SELECT COUNT(*) as cnt FROM assignments').get().cnt + 1;
  const assignmentRef = `ASN-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const transaction = db.transaction(() => {
    // Insert assignment record
    const insertStmt = db.prepare(`
      INSERT INTO assignments (assignment_ref, base_id, asset_id, assigned_to_name, assigned_to_service_id, unit_squad, quantity, assigned_date, expected_return_date, status, assigned_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
    `);
    const result = insertStmt.run(assignmentRef, base_id, asset_id, assigned_to_name, assigned_to_service_id, unit_squad || 'Default Platoon', parsedQty, aDate, expected_return_date || null, req.user.id);

    return result.lastInsertRowid;
  });

  try {
    const assignmentId = transaction();

    logAudit(req, 'CREATE_ASSIGNMENT', 'assignments', assignmentRef, base_id, {
      asset_id,
      assigned_to_name,
      assigned_to_service_id,
      quantity: parsedQty
    });

    const newRecord = db.prepare(`
      SELECT asn.*, b.name as base_name, a.name as asset_name, et.name as equipment_type_name
      FROM assignments asn
      JOIN bases b ON asn.base_id = b.id
      JOIN assets a ON asn.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      WHERE asn.id = ?
    `).get(assignmentId);

    res.status(201).json({
      message: 'Asset assigned successfully.',
      assignment: newRecord
    });
  } catch (error) {
    console.error('Error assigning asset:', error);
    res.status(500).json({ message: 'Failed to assign asset.', error: error.message });
  }
});

// PATCH /api/assignments/:id/return - Return assigned asset
router.patch('/:id/return', authenticateToken, authorizeRoles('Admin', 'Base Commander'), (req, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ message: 'Assignment record not found.' });
  }

  if (existing.status === 'Returned') {
    return res.status(400).json({ message: 'Asset is already marked as returned.' });
  }

  // Base scope check
  if (req.user.role !== 'Admin' && req.user.base_id) {
    if (parseInt(existing.base_id, 10) !== parseInt(req.user.base_id, 10)) {
      return res.status(403).json({ message: 'RBAC Violation: Cannot return asset assigned at another base.' });
    }
  }

  db.prepare('UPDATE assignments SET status = "Returned" WHERE id = ?').run(id);

  logAudit(req, 'RETURN_ASSIGNMENT', 'assignments', existing.assignment_ref, existing.base_id, {
    assigned_to_name: existing.assigned_to_name,
    asset_id: existing.asset_id,
    quantity: existing.quantity
  });

  res.json({ message: 'Asset marked as returned to armory stock.' });
});

module.exports = router;
