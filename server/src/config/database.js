const Database = require('better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const defaultDbPath = process.env.NODE_ENV === 'production' 
  ? path.join('/tmp', 'mams_database.sqlite')
  : path.join(__dirname, '../../mams_database.sqlite');

const dbPath = process.env.DB_FILE || defaultDbPath;
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      location TEXT NOT NULL,
      commanding_officer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS equipment_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category_code TEXT NOT NULL UNIQUE,
      unit_of_measure TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_type_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      model_code TEXT NOT NULL UNIQUE,
      specification TEXT,
      unit_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Admin', 'Base Commander', 'Logistics Officer')),
      base_id INTEGER,
      rank_title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      base_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      opening_balance INTEGER DEFAULT 0,
      current_stock INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      UNIQUE(base_id, asset_id)
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_ref TEXT NOT NULL UNIQUE,
      base_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      unit_cost REAL NOT NULL CHECK(unit_cost >= 0),
      total_cost REAL NOT NULL CHECK(total_cost >= 0),
      supplier TEXT NOT NULL,
      purchase_date DATETIME NOT NULL,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_ref TEXT NOT NULL UNIQUE,
      from_base_id INTEGER NOT NULL,
      to_base_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      status TEXT NOT NULL DEFAULT 'Completed' CHECK(status IN ('Pending', 'In Transit', 'Completed', 'Cancelled')),
      transfer_date DATETIME NOT NULL,
      notes TEXT,
      initiated_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_base_id) REFERENCES bases(id) ON DELETE CASCADE,
      FOREIGN KEY (to_base_id) REFERENCES bases(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_ref TEXT NOT NULL UNIQUE,
      base_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      assigned_to_name TEXT NOT NULL,
      assigned_to_service_id TEXT NOT NULL,
      unit_squad TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      assigned_date DATETIME NOT NULL,
      expected_return_date DATETIME,
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Returned')),
      assigned_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS expenditures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expenditure_ref TEXT NOT NULL UNIQUE,
      base_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      reason TEXT NOT NULL,
      expended_date DATETIME NOT NULL,
      reported_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      base_id INTEGER,
      details TEXT,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE SET NULL
    );
  `);
}

initializeDatabase();

module.exports = db;
