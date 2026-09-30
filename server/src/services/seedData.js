const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seedDatabase() {
  try {
    const existingUsers = await db.get('SELECT COUNT(*) as count FROM users');
    if (existingUsers && existingUsers.count > 0) {
      console.log('Database already contains data. Skipping full re-seed.');
      return;
    }

    console.log('Seeding initial military asset management data...');

    const passwordHash = bcrypt.hashSync('Password123!', 10);

    // 1. Seed Bases
    const resB1 = await db.run('INSERT INTO bases (name, code, location, commanding_officer) VALUES (?, ?, ?, ?)', 'Fort Sentinel', 'BASE-FS01', 'Fort Meade, MD', 'Col. Marcus Miller');
    const base1 = resB1.lastInsertRowid;

    const resB2 = await db.run('INSERT INTO bases (name, code, location, commanding_officer) VALUES (?, ?, ?, ?)', 'Camp Apex Alpha', 'BASE-CAA02', 'Fort Liberty, NC', 'Maj. Sarah Jenkins');
    const base2 = resB2.lastInsertRowid;

    const resB3 = await db.run('INSERT INTO bases (name, code, location, commanding_officer) VALUES (?, ?, ?, ?)', 'Naval Garrison Horizon', 'BASE-NGH03', 'Norfolk, VA', 'Capt. Eleanor Vance');
    const base3 = resB3.lastInsertRowid;

    const resB4 = await db.run('INSERT INTO bases (name, code, location, commanding_officer) VALUES (?, ?, ?, ?)', 'Forward Operating Base Vanguard', 'BASE-FOB04', 'Sector 4 Operational Zone', 'Lt. Col. Thomas Hayes');
    const base4 = resB4.lastInsertRowid;

    // 2. Seed Equipment Types
    const resT1 = await db.run('INSERT INTO equipment_types (name, category_code, unit_of_measure, description) VALUES (?, ?, ?, ?)', 'Weapons', 'WPN', 'Units', 'Small arms, assault rifles, sidearms, sniper rifles');
    const typeWeapons = resT1.lastInsertRowid;

    const resT2 = await db.run('INSERT INTO equipment_types (name, category_code, unit_of_measure, description) VALUES (?, ?, ?, ?)', 'Vehicles', 'VHC', 'Vehicles', 'Light tactical vehicles, armored personnel carriers, main battle tanks');
    const typeVehicles = resT2.lastInsertRowid;

    const resT3 = await db.run('INSERT INTO equipment_types (name, category_code, unit_of_measure, description) VALUES (?, ?, ?, ?)', 'Ammunition', 'AMMO', 'Rounds (Crates)', 'Caliber specific ball ammunition, high explosive shells');
    const typeAmmo = resT3.lastInsertRowid;

    const resT4 = await db.run('INSERT INTO equipment_types (name, category_code, unit_of_measure, description) VALUES (?, ?, ?, ?)', 'Communications', 'COMM', 'Sets', 'Tactical encrypted radios, satellite uplinks, field transceivers');
    const typeComm = resT4.lastInsertRowid;

    const resT5 = await db.run('INSERT INTO equipment_types (name, category_code, unit_of_measure, description) VALUES (?, ?, ?, ?)', 'Heavy Ordnance', 'ORD', 'Units', 'Guided missiles, anti-armor rocket launchers, mortar systems');
    const typeHeavy = resT5.lastInsertRowid;

    // 3. Seed Assets
    const resA1 = await db.run('INSERT INTO assets (equipment_type_id, name, model_code, specification, unit_cost) VALUES (?, ?, ?, ?, ?)', typeWeapons, 'M4A1 Carbine 5.56mm', 'WPN-M4A1-V2', 'Standard Issue Select-fire Rifle', 1450.00);
    const assetM4 = resA1.lastInsertRowid;

    const resA2 = await db.run('INSERT INTO assets (equipment_type_id, name, model_code, specification, unit_cost) VALUES (?, ?, ?, ?, ?)', typeWeapons, 'M17 Modular Handgun 9mm', 'WPN-M17-9MM', '9x19mm NATO Service Pistol', 680.00);
    const assetM17 = resA2.lastInsertRowid;

    const resA3 = await db.run('INSERT INTO assets (equipment_type_id, name, model_code, specification, unit_cost) VALUES (?, ?, ?, ?, ?)', typeVehicles, 'Oshkosh JLTV Heavy Tactical', 'VHC-JLTV-4x4', 'Joint Light Tactical Vehicle 4x4', 375000.00);
    const assetJLTV = resA3.lastInsertRowid;

    const resA4 = await db.run('INSERT INTO assets (equipment_type_id, name, model_code, specification, unit_cost) VALUES (?, ?, ?, ?, ?)', typeVehicles, 'M1A2 Abrams Main Tank', 'VHC-M1A2-SEPv3', 'Main Battle Tank with SEPv3 Package', 8900000.00);
    const assetAbrams = resA4.lastInsertRowid;

    const resA5 = await db.run('INSERT INTO assets (equipment_type_id, name, model_code, specification, unit_cost) VALUES (?, ?, ?, ?, ?)', typeAmmo, '5.56x45mm NATO Ball (Crate 1000)', 'AMMO-556-CRATE', '1,000 Round Sealed Metallic Crate', 520.00);
    const asset556Ammo = resA5.lastInsertRowid;

    const resA6 = await db.run('INSERT INTO assets (equipment_type_id, name, model_code, specification, unit_cost) VALUES (?, ?, ?, ?, ?)', typeAmmo, '155mm M795 HE Artillery Shell', 'AMMO-155-HE', 'High Explosive Artillery Projectile', 1200.00);
    const asset155Ammo = resA6.lastInsertRowid;

    const resA7 = await db.run('INSERT INTO assets (equipment_type_id, name, model_code, specification, unit_cost) VALUES (?, ?, ?, ?, ?)', typeComm, 'AN/PRC-152A Tactical Radio', 'COMM-PRC152A', 'Handheld Multi-band Encrypted Radio', 7800.00);
    const assetRadio = resA7.lastInsertRowid;

    const resA8 = await db.run('INSERT INTO assets (equipment_type_id, name, model_code, specification, unit_cost) VALUES (?, ?, ?, ?, ?)', typeHeavy, 'FGM-148 Javelin Missile Unit', 'ORD-JAVELIN-FGM', 'Man-portable Anti-tank Guided Missile', 178000.00);
    const assetJavelin = resA8.lastInsertRowid;

    // 4. Seed Users
    const resU1 = await db.run('INSERT INTO users (username, password_hash, full_name, role, base_id, rank_title) VALUES (?, ?, ?, ?, ?, ?)', 'admin', passwordHash, 'Gen. Raymond Vance', 'Admin', null, 'General');
    const userAdmin = resU1.lastInsertRowid;

    const resU2 = await db.run('INSERT INTO users (username, password_hash, full_name, role, base_id, rank_title) VALUES (?, ?, ?, ?, ?, ?)', 'commander_fort_sentinel', passwordHash, 'Col. Marcus Miller', 'Base Commander', base1, 'Colonel');
    const userCommanderFS = resU2.lastInsertRowid;

    const resU3 = await db.run('INSERT INTO users (username, password_hash, full_name, role, base_id, rank_title) VALUES (?, ?, ?, ?, ?, ?)', 'commander_camp_apex', passwordHash, 'Maj. Sarah Jenkins', 'Base Commander', base2, 'Major');
    const userCommanderCA = resU3.lastInsertRowid;

    const resU4 = await db.run('INSERT INTO users (username, password_hash, full_name, role, base_id, rank_title) VALUES (?, ?, ?, ?, ?, ?)', 'logistics_officer', passwordHash, 'Capt. David Rossi', 'Logistics Officer', base1, 'Captain');
    const userLogistics = resU4.lastInsertRowid;

    // 5. Seed Inventory Opening Balances Baseline
    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base1, assetM4, 250, 250);
    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base1, assetM17, 180, 180);
    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base1, assetJLTV, 25, 25);
    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base1, asset556Ammo, 500, 500);
    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base1, assetRadio, 80, 80);

    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base2, assetM4, 150, 150);
    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base2, assetJLTV, 15, 15);
    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base2, asset155Ammo, 120, 120);
    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base2, assetJavelin, 12, 12);

    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base3, assetRadio, 45, 45);
    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base3, assetM17, 90, 90);

    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base4, assetM4, 80, 80);
    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base4, asset556Ammo, 200, 200);
    await db.run('INSERT INTO inventory (base_id, asset_id, opening_balance, current_stock) VALUES (?, ?, ?, ?)', base4, assetJavelin, 6, 6);

    // 6. Seed Purchases
    await db.run('INSERT INTO purchases (purchase_ref, base_id, asset_id, quantity, unit_cost, total_cost, supplier, purchase_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 'PUR-2026-001', base1, assetM4, 50, 1450.00, 72500.00, 'Colt Defense Systems LLC', '2026-08-10 10:00:00', userLogistics);
    await db.run('INSERT INTO purchases (purchase_ref, base_id, asset_id, quantity, unit_cost, total_cost, supplier, purchase_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 'PUR-2026-002', base1, assetJLTV, 5, 375000.00, 1875000.00, 'Oshkosh Defense Tactical', '2026-08-15 14:30:00', userLogistics);
    await db.run('INSERT INTO purchases (purchase_ref, base_id, asset_id, quantity, unit_cost, total_cost, supplier, purchase_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 'PUR-2026-003', base2, asset155Ammo, 80, 1200.00, 96000.00, 'General Dynamics Ordnance', '2026-08-20 09:15:00', userCommanderCA);
    await db.run('INSERT INTO purchases (purchase_ref, base_id, asset_id, quantity, unit_cost, total_cost, supplier, purchase_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 'PUR-2026-004', base1, asset556Ammo, 200, 520.00, 104000.00, 'Lake City Army Ammunition Plant', '2026-09-02 11:00:00', userLogistics);
    await db.run('INSERT INTO purchases (purchase_ref, base_id, asset_id, quantity, unit_cost, total_cost, supplier, purchase_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 'PUR-2026-005', base3, assetRadio, 25, 7800.00, 195000.00, 'Harris Tactical Comms', '2026-09-12 16:45:00', userAdmin);
    await db.run('INSERT INTO purchases (purchase_ref, base_id, asset_id, quantity, unit_cost, total_cost, supplier, purchase_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 'PUR-2026-006', base2, assetJavelin, 4, 178000.00, 712000.00, 'Raytheon Lockheed JVL JV', '2026-09-18 13:20:00', userCommanderCA);

    // 7. Seed Transfers
    await db.run('INSERT INTO transfers (transfer_ref, from_base_id, to_base_id, asset_id, quantity, status, transfer_date, notes, initiated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 'TRF-2026-001', base1, base2, assetM4, 30, 'Completed', '2026-08-18 08:30:00', 'Routine battalion redistribution for tactical exercise', userLogistics);
    await db.run('INSERT INTO transfers (transfer_ref, from_base_id, to_base_id, asset_id, quantity, status, transfer_date, notes, initiated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 'TRF-2026-002', base1, base4, asset556Ammo, 100, 'Completed', '2026-08-25 15:00:00', 'Emergency ammunition re-supply to FOB Vanguard', userCommanderFS);
    await db.run('INSERT INTO transfers (transfer_ref, from_base_id, to_base_id, asset_id, quantity, status, transfer_date, notes, initiated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 'TRF-2026-003', base2, base4, assetJavelin, 2, 'Completed', '2026-09-05 10:20:00', 'Reinforce forward anti-armor capabilities', userCommanderCA);
    await db.run('INSERT INTO transfers (transfer_ref, from_base_id, to_base_id, asset_id, quantity, status, transfer_date, notes, initiated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 'TRF-2026-004', base3, base1, assetRadio, 10, 'Completed', '2026-09-15 14:10:00', 'Inter-base comms upgrade dispatch', userLogistics);
    await db.run('INSERT INTO transfers (transfer_ref, from_base_id, to_base_id, asset_id, quantity, status, transfer_date, notes, initiated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 'TRF-2026-005', base1, base2, assetJLTV, 2, 'In Transit', '2026-09-28 09:00:00', 'Heavy transport vehicle relocation', userLogistics);

    // 8. Seed Assignments
    await db.run('INSERT INTO assignments (assignment_ref, base_id, asset_id, assigned_to_name, assigned_to_service_id, unit_squad, quantity, assigned_date, expected_return_date, status, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 'ASN-2026-001', base1, assetM4, 'Sgt. Marcus Brody', 'MIL-449102', '1st Recon Platoon', 1, '2026-08-12 09:00:00', '2026-10-12 18:00:00', 'Active', userCommanderFS);
    await db.run('INSERT INTO assignments (assignment_ref, base_id, asset_id, assigned_to_name, assigned_to_service_id, unit_squad, quantity, assigned_date, expected_return_date, status, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 'ASN-2026-002', base1, assetJLTV, 'Lt. Daniel Connor', 'MIL-773194', 'Alpha Motor Transport Unit', 1, '2026-08-16 08:00:00', '2026-11-01 17:00:00', 'Active', userCommanderFS);
    await db.run('INSERT INTO assignments (assignment_ref, base_id, asset_id, assigned_to_name, assigned_to_service_id, unit_squad, quantity, assigned_date, expected_return_date, status, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 'ASN-2026-003', base2, assetM4, 'Cpl. Jennifer Ruiz', 'MIL-338291', '2nd Infantry Squad', 1, '2026-08-22 13:30:00', '2026-09-22 17:00:00', 'Returned', userCommanderCA);
    await db.run('INSERT INTO assignments (assignment_ref, base_id, asset_id, assigned_to_name, assigned_to_service_id, unit_squad, quantity, assigned_date, expected_return_date, status, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 'ASN-2026-004', base2, asset155Ammo, 'Master Sgt. Keith Vance', 'MIL-991043', 'Field Artillery Battery B', 20, '2026-09-10 07:45:00', null, 'Active', userCommanderCA);
    await db.run('INSERT INTO assignments (assignment_ref, base_id, asset_id, assigned_to_name, assigned_to_service_id, unit_squad, quantity, assigned_date, expected_return_date, status, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 'ASN-2026-005', base1, assetRadio, 'Sgt. Elena Rostova', 'MIL-551029', 'Signals Operations Cell', 4, '2026-09-20 11:15:00', '2026-12-31 18:00:00', 'Active', userCommanderFS);

    // 9. Seed Expenditures
    await db.run('INSERT INTO expenditures (expenditure_ref, base_id, asset_id, quantity, reason, expended_date, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?)', 'EXP-2026-001', base2, asset155Ammo, 15, 'Live-fire artillery qualification drill at Range 4', '2026-08-28 16:00:00', userCommanderCA);
    await db.run('INSERT INTO expenditures (expenditure_ref, base_id, asset_id, quantity, reason, expended_date, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?)', 'EXP-2026-002', base1, asset556Ammo, 50, 'Quarterly marksmanship certification training', '2026-09-08 17:30:00', userCommanderFS);
    await db.run('INSERT INTO expenditures (expenditure_ref, base_id, asset_id, quantity, reason, expended_date, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?)', 'EXP-2026-003', base4, asset556Ammo, 30, 'Forward perimeter defense live engagement drill', '2026-09-14 21:00:00', userAdmin);
    await db.run('INSERT INTO expenditures (expenditure_ref, base_id, asset_id, quantity, reason, expended_date, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?)', 'EXP-2026-004', base2, assetJavelin, 1, 'Annual anti-tank missile validation test', '2026-09-25 10:30:00', userCommanderCA);

    // 10. Seed Audit Logs
    await db.run('INSERT INTO audit_logs (user_id, user_name, user_role, action, resource_type, resource_id, base_id, details, ip_address, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', userLogistics, 'Capt. David Rossi', 'Logistics Officer', 'RECORD_PURCHASE', 'purchases', 'PUR-2026-001', base1, '{"asset":"M4A1 Carbine","qty":50,"cost":72500}', '192.168.1.45', '2026-08-10 10:00:00');
    await db.run('INSERT INTO audit_logs (user_id, user_name, user_role, action, resource_type, resource_id, base_id, details, ip_address, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', userLogistics, 'Capt. David Rossi', 'Logistics Officer', 'INITIATE_TRANSFER', 'transfers', 'TRF-2026-001', base1, '{"from":"Fort Sentinel","to":"Camp Apex Alpha","asset":"M4A1 Carbine","qty":30}', '192.168.1.45', '2026-08-18 08:30:00');
    await db.run('INSERT INTO audit_logs (user_id, user_name, user_role, action, resource_type, resource_id, base_id, details, ip_address, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', userCommanderCA, 'Maj. Sarah Jenkins', 'Base Commander', 'LOG_EXPENDITURE', 'expenditures', 'EXP-2026-001', base2, '{"asset":"155mm M795 HE Shell","qty":15,"reason":"Live-fire drill"}', '10.0.4.12', '2026-08-28 16:00:00');
    await db.run('INSERT INTO audit_logs (user_id, user_name, user_role, action, resource_type, resource_id, base_id, details, ip_address, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', userCommanderFS, 'Col. Marcus Miller', 'Base Commander', 'CREATE_ASSIGNMENT', 'assignments', 'ASN-2026-001', base1, '{"assigned_to":"Sgt. Marcus Brody","asset":"M4A1 Carbine"}', '192.168.1.10', '2026-08-12 09:00:00');

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error during database seeding:', err);
  }
}

module.exports = { seedDatabase };
