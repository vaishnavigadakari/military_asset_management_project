const db = require('../config/database');

/**
 * Computes opening balance, net movement, closing balance, assigned and expended metrics
 * with support for Date range, Base, and Equipment Type filters.
 */
async function getDashboardMetrics(filters = {}) {
  const { startDate, endDate, baseId, equipmentTypeId } = filters;

  // 1. Calculate Opening Balance Baseline
  let invQuery = `
    SELECT COALESCE(SUM(inv.opening_balance), 0) as total
    FROM inventory inv
    JOIN bases b ON inv.base_id = b.id
    JOIN assets a ON inv.asset_id = a.id
    JOIN equipment_types et ON a.equipment_type_id = et.id
    WHERE 1=1
  `;
  const invParams = [];
  if (baseId && baseId !== 'all') {
    invQuery += ' AND inv.base_id = ?';
    invParams.push(baseId);
  }
  if (equipmentTypeId && equipmentTypeId !== 'all') {
    invQuery += ' AND et.id = ?';
    invParams.push(equipmentTypeId);
  }
  const baseOpeningRes = await db.get(invQuery, ...invParams);
  let openingBalance = baseOpeningRes ? baseOpeningRes.total : 0;

  if (startDate) {
    // Add Purchases prior to startDate
    let priorPurchasesQuery = `
      SELECT COALESCE(SUM(p.quantity), 0) as total
      FROM purchases p
      JOIN assets a ON p.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      WHERE p.purchase_date < ?
    `;
    const priorPParams = [startDate];
    if (baseId && baseId !== 'all') {
      priorPurchasesQuery += ' AND p.base_id = ?';
      priorPParams.push(baseId);
    }
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      priorPurchasesQuery += ' AND et.id = ?';
      priorPParams.push(equipmentTypeId);
    }
    const priorPRes = await db.get(priorPurchasesQuery, ...priorPParams);
    const priorPurchases = priorPRes ? priorPRes.total : 0;

    // Add Transfers In prior to startDate
    let priorTrfInQuery = `
      SELECT COALESCE(SUM(t.quantity), 0) as total
      FROM transfers t
      JOIN assets a ON t.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      WHERE t.transfer_date < ? AND t.status = 'Completed'
    `;
    const priorTrfInParams = [startDate];
    if (baseId && baseId !== 'all') {
      priorTrfInQuery += ' AND t.to_base_id = ?';
      priorTrfInParams.push(baseId);
    }
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      priorTrfInQuery += ' AND et.id = ?';
      priorTrfInParams.push(equipmentTypeId);
    }
    const priorTrfInRes = await db.get(priorTrfInQuery, ...priorTrfInParams);
    const priorTrfIn = priorTrfInRes ? priorTrfInRes.total : 0;

    // Deduct Transfers Out prior to startDate
    let priorTrfOutQuery = `
      SELECT COALESCE(SUM(t.quantity), 0) as total
      FROM transfers t
      JOIN assets a ON t.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      WHERE t.transfer_date < ? AND t.status = 'Completed'
    `;
    const priorTrfOutParams = [startDate];
    if (baseId && baseId !== 'all') {
      priorTrfOutQuery += ' AND t.from_base_id = ?';
      priorTrfOutParams.push(baseId);
    }
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      priorTrfOutQuery += ' AND et.id = ?';
      priorTrfOutParams.push(equipmentTypeId);
    }
    const priorTrfOutRes = await db.get(priorTrfOutQuery, ...priorTrfOutParams);
    const priorTrfOut = priorTrfOutRes ? priorTrfOutRes.total : 0;

    // Deduct Expenditures prior to startDate
    let priorExpQuery = `
      SELECT COALESCE(SUM(e.quantity), 0) as total
      FROM expenditures e
      JOIN assets a ON e.asset_id = a.id
      JOIN equipment_types et ON a.equipment_type_id = et.id
      WHERE e.expended_date < ?
    `;
    const priorExpParams = [startDate];
    if (baseId && baseId !== 'all') {
      priorExpQuery += ' AND e.base_id = ?';
      priorExpParams.push(baseId);
    }
    if (equipmentTypeId && equipmentTypeId !== 'all') {
      priorExpQuery += ' AND et.id = ?';
      priorExpParams.push(equipmentTypeId);
    }
    const priorExpRes = await db.get(priorExpQuery, ...priorExpParams);
    const priorExp = priorExpRes ? priorExpRes.total : 0;

    openingBalance = openingBalance + priorPurchases + priorTrfIn - priorTrfOut - priorExp;
  }

  // 2. Calculate Purchases within Date Range
  let purchasesQuery = `
    SELECT COALESCE(SUM(p.quantity), 0) as total, COALESCE(SUM(p.total_cost), 0) as total_value
    FROM purchases p
    JOIN assets a ON p.asset_id = a.id
    JOIN equipment_types et ON a.equipment_type_id = et.id
    WHERE 1=1
  `;
  const pParams = [];
  if (startDate) { purchasesQuery += ' AND p.purchase_date >= ?'; pParams.push(startDate); }
  if (endDate) { purchasesQuery += ' AND p.purchase_date <= ?'; pParams.push(endDate + ' 23:59:59'); }
  if (baseId && baseId !== 'all') { purchasesQuery += ' AND p.base_id = ?'; pParams.push(baseId); }
  if (equipmentTypeId && equipmentTypeId !== 'all') { purchasesQuery += ' AND et.id = ?'; pParams.push(equipmentTypeId); }
  const purchaseRes = await db.get(purchasesQuery, ...pParams);
  const purchasesCount = purchaseRes ? purchaseRes.total : 0;
  const purchasesValue = purchaseRes ? purchaseRes.total_value : 0;

  // 3. Calculate Transfers In within Date Range
  let trfInQuery = `
    SELECT COALESCE(SUM(t.quantity), 0) as total
    FROM transfers t
    JOIN assets a ON t.asset_id = a.id
    JOIN equipment_types et ON a.equipment_type_id = et.id
    WHERE t.status = 'Completed'
  `;
  const trfInParams = [];
  if (startDate) { trfInQuery += ' AND t.transfer_date >= ?'; trfInParams.push(startDate); }
  if (endDate) { trfInQuery += ' AND t.transfer_date <= ?'; trfInParams.push(endDate + ' 23:59:59'); }
  if (baseId && baseId !== 'all') { trfInQuery += ' AND t.to_base_id = ?'; trfInParams.push(baseId); }
  if (equipmentTypeId && equipmentTypeId !== 'all') { trfInQuery += ' AND et.id = ?'; trfInParams.push(equipmentTypeId); }
  const trfInRes = await db.get(trfInQuery, ...trfInParams);
  const transfersInCount = trfInRes ? trfInRes.total : 0;

  // 4. Calculate Transfers Out within Date Range
  let trfOutQuery = `
    SELECT COALESCE(SUM(t.quantity), 0) as total
    FROM transfers t
    JOIN assets a ON t.asset_id = a.id
    JOIN equipment_types et ON a.equipment_type_id = et.id
    WHERE t.status = 'Completed'
  `;
  const trfOutParams = [];
  if (startDate) { trfOutQuery += ' AND t.transfer_date >= ?'; trfOutParams.push(startDate); }
  if (endDate) { trfOutQuery += ' AND t.transfer_date <= ?'; trfOutParams.push(endDate + ' 23:59:59'); }
  if (baseId && baseId !== 'all') { trfOutQuery += ' AND t.from_base_id = ?'; trfOutParams.push(baseId); }
  if (equipmentTypeId && equipmentTypeId !== 'all') { trfOutQuery += ' AND et.id = ?'; trfOutParams.push(equipmentTypeId); }
  const trfOutRes = await db.get(trfOutQuery, ...trfOutParams);
  const transfersOutCount = trfOutRes ? trfOutRes.total : 0;

  // 5. Calculate Expended within Date Range
  let expendedQuery = `
    SELECT COALESCE(SUM(e.quantity), 0) as total
    FROM expenditures e
    JOIN assets a ON e.asset_id = a.id
    JOIN equipment_types et ON a.equipment_type_id = et.id
    WHERE 1=1
  `;
  const expParams = [];
  if (startDate) { expendedQuery += ' AND e.expended_date >= ?'; expParams.push(startDate); }
  if (endDate) { expendedQuery += ' AND e.expended_date <= ?'; expParams.push(endDate + ' 23:59:59'); }
  if (baseId && baseId !== 'all') { expendedQuery += ' AND e.base_id = ?'; expParams.push(baseId); }
  if (equipmentTypeId && equipmentTypeId !== 'all') { expendedQuery += ' AND et.id = ?'; expParams.push(equipmentTypeId); }
  const expRes = await db.get(expendedQuery, ...expParams);
  const expendedCount = expRes ? expRes.total : 0;

  // 6. Calculate Assigned
  let assignedQuery = `
    SELECT COALESCE(SUM(asn.quantity), 0) as total
    FROM assignments asn
    JOIN assets a ON asn.asset_id = a.id
    JOIN equipment_types et ON a.equipment_type_id = et.id
    WHERE asn.status = 'Active'
  `;
  const asnParams = [];
  if (baseId && baseId !== 'all') { assignedQuery += ' AND asn.base_id = ?'; asnParams.push(baseId); }
  if (equipmentTypeId && equipmentTypeId !== 'all') { assignedQuery += ' AND et.id = ?'; asnParams.push(equipmentTypeId); }
  const asnRes = await db.get(assignedQuery, ...asnParams);
  const assignedCount = asnRes ? asnRes.total : 0;

  const netMovement = purchasesCount + transfersInCount - transfersOutCount;
  const closingBalance = openingBalance + netMovement - expendedCount;

  return {
    openingBalance,
    purchases: purchasesCount,
    purchasesValue,
    transfersIn: transfersInCount,
    transfersOut: transfersOutCount,
    netMovement,
    expended: expendedCount,
    closingBalance,
    assigned: assignedCount
  };
}

async function getNetMovementBreakdown(filters = {}) {
  const { startDate, endDate, baseId, equipmentTypeId } = filters;

  let pQuery = `
    SELECT p.id, p.purchase_ref, p.purchase_date, b.name as base_name, a.name as asset_name,
           et.name as equipment_type, p.quantity, p.unit_cost, p.total_cost, p.supplier
    FROM purchases p
    JOIN bases b ON p.base_id = b.id
    JOIN assets a ON p.asset_id = a.id
    JOIN equipment_types et ON a.equipment_type_id = et.id
    WHERE 1=1
  `;
  const pParams = [];
  if (startDate) { pQuery += ' AND p.purchase_date >= ?'; pParams.push(startDate); }
  if (endDate) { pQuery += ' AND p.purchase_date <= ?'; pParams.push(endDate + ' 23:59:59'); }
  if (baseId && baseId !== 'all') { pQuery += ' AND p.base_id = ?'; pParams.push(baseId); }
  if (equipmentTypeId && equipmentTypeId !== 'all') { pQuery += ' AND et.id = ?'; pParams.push(equipmentTypeId); }
  pQuery += ' ORDER BY p.purchase_date DESC';
  const purchasesList = await db.all(pQuery, ...pParams);

  let trfInQuery = `
    SELECT t.id, t.transfer_ref, t.transfer_date, fb.name as from_base, tb.name as to_base,
           a.name as asset_name, et.name as equipment_type, t.quantity, t.status, t.notes
    FROM transfers t
    JOIN bases fb ON t.from_base_id = fb.id
    JOIN bases tb ON t.to_base_id = tb.id
    JOIN assets a ON t.asset_id = a.id
    JOIN equipment_types et ON a.equipment_type_id = et.id
    WHERE t.status = 'Completed'
  `;
  const trfInParams = [];
  if (startDate) { trfInQuery += ' AND t.transfer_date >= ?'; trfInParams.push(startDate); }
  if (endDate) { trfInQuery += ' AND t.transfer_date <= ?'; trfInParams.push(endDate + ' 23:59:59'); }
  if (baseId && baseId !== 'all') { trfInQuery += ' AND t.to_base_id = ?'; trfInParams.push(baseId); }
  if (equipmentTypeId && equipmentTypeId !== 'all') { trfInQuery += ' AND et.id = ?'; trfInParams.push(equipmentTypeId); }
  trfInQuery += ' ORDER BY t.transfer_date DESC';
  const transfersInList = await db.all(trfInQuery, ...trfInParams);

  let trfOutQuery = `
    SELECT t.id, t.transfer_ref, t.transfer_date, fb.name as from_base, tb.name as to_base,
           a.name as asset_name, et.name as equipment_type, t.quantity, t.status, t.notes
    FROM transfers t
    JOIN bases fb ON t.from_base_id = fb.id
    JOIN bases tb ON t.to_base_id = tb.id
    JOIN assets a ON t.asset_id = a.id
    JOIN equipment_types et ON a.equipment_type_id = et.id
    WHERE t.status = 'Completed'
  `;
  const trfOutParams = [];
  if (startDate) { trfOutQuery += ' AND t.transfer_date >= ?'; trfOutParams.push(startDate); }
  if (endDate) { trfOutQuery += ' AND t.transfer_date <= ?'; trfOutParams.push(endDate + ' 23:59:59'); }
  if (baseId && baseId !== 'all') { trfOutQuery += ' AND t.from_base_id = ?'; trfOutParams.push(baseId); }
  if (equipmentTypeId && equipmentTypeId !== 'all') { trfOutQuery += ' AND et.id = ?'; trfOutParams.push(equipmentTypeId); }
  trfOutQuery += ' ORDER BY t.transfer_date DESC';
  const transfersOutList = await db.all(trfOutQuery, ...trfOutParams);

  return {
    purchasesList,
    transfersInList,
    transfersOutList
  };
}

module.exports = {
  getDashboardMetrics,
  getNetMovementBreakdown
};
