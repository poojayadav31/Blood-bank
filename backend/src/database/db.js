const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let pool = null;
let sqliteDb = null;
let dbMode = 'sqlite'; // 'postgres' or 'sqlite'

const dbPath = path.resolve(__dirname, 'bloodbank.sqlite');

// Initialize database connection
async function initDb() {
  const connectionString = process.env.DATABASE_URL;
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || 5432;
  const dbName = process.env.DB_NAME || 'bloodbank';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';

  // Try PostgreSQL first if configured
  if (process.env.USE_POSTGRES === 'true' || connectionString) {
    try {
      pool = new Pool(
        connectionString
          ? { connectionString }
          : {
              host: dbHost,
              port: dbPort,
              database: dbName,
              user: dbUser,
              password: dbPassword,
              connectionTimeoutMillis: 2000,
            }
      );

      // Test connection
      await pool.query('SELECT 1');
      dbMode = 'postgres';
      console.log('✅ Connected to PostgreSQL database successfully.');
      await runPostgresSchema();
      return;
    } catch (err) {
      console.warn('⚠️  PostgreSQL connection failed or unavailable. Falling back to built-in SQLite engine.');
    }
  }

  // Fallback to SQLite
  dbMode = 'sqlite';
  return new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('❌ Failed to open SQLite database:', err);
        return reject(err);
      }
      console.log('✅ Relational Database initialized at:', dbPath);
      try {
        await runSqliteSchema();
        resolve();
      } catch (schemaErr) {
        reject(schemaErr);
      }
    });
  });
}

// Run schema on PostgreSQL
async function runPostgresSchema() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
    console.log('✅ PostgreSQL Schema initialized.');
  }
}

// Run schema on SQLite
function runSqliteSchema() {
  return new Promise((resolve, reject) => {
    sqliteDb.serialize(() => {
      sqliteDb.run('PRAGMA foreign_keys = ON');

      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS organizations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          registration_number TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL,
          address TEXT NOT NULL,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          pincode TEXT NOT NULL,
          contact_person TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT NOT NULL,
          website TEXT,
          certificate_url TEXT,
          license_url TEXT,
          status TEXT DEFAULT 'pending',
          collection_limit INTEGER DEFAULT 300,
          rejection_reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          phone TEXT,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS camps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          organizer TEXT NOT NULL,
          location TEXT NOT NULL,
          address TEXT NOT NULL,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          date TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          expected_donors INTEGER NOT NULL,
          expected_blood_bags INTEGER NOT NULL,
          collected_blood_bags INTEGER DEFAULT 0,
          description TEXT,
          poster_url TEXT,
          status TEXT DEFAULT 'scheduled',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS donors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          dob TEXT NOT NULL,
          gender TEXT NOT NULL,
          blood_group TEXT NOT NULL,
          weight REAL NOT NULL,
          mobile TEXT NOT NULL,
          email TEXT NOT NULL,
          address TEXT,
          city TEXT,
          state TEXT,
          pincode TEXT,
          last_donation_date TEXT,
          medical_history TEXT,
          emergency_contact_name TEXT,
          emergency_contact_phone TEXT,
          total_donations INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS camp_registrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          camp_id INTEGER NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
          donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
          qr_code_token TEXT UNIQUE NOT NULL,
          status TEXT DEFAULT 'registered',
          vital_bp TEXT,
          vital_hb REAL,
          vital_weight REAL,
          blood_bags_collected INTEGER DEFAULT 0,
          rejection_reason TEXT,
          certificate_id TEXT,
          donation_timestamp DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS blood_inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          blood_group TEXT NOT NULL,
          available_units INTEGER DEFAULT 0,
          reserved_units INTEGER DEFAULT 0,
          expired_units INTEGER DEFAULT 0,
          issued_units INTEGER DEFAULT 0,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(organization_id, blood_group)
        );
      `);

      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS blood_batches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          camp_id INTEGER REFERENCES camps(id) ON DELETE SET NULL,
          donor_id INTEGER REFERENCES donors(id) ON DELETE SET NULL,
          blood_group TEXT NOT NULL,
          units INTEGER DEFAULT 1,
          collection_date TEXT NOT NULL,
          expiry_date TEXT NOT NULL,
          status TEXT DEFAULT 'available',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS blood_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          hospital_name TEXT NOT NULL,
          contact_person TEXT NOT NULL,
          contact_phone TEXT NOT NULL,
          contact_email TEXT,
          blood_group TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          urgency TEXT DEFAULT 'Normal',
          patient_case TEXT,
          required_by_date TEXT,
          status TEXT DEFAULT 'pending',
          fulfilled_by_org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
          fulfilled_units INTEGER DEFAULT 0,
          remarks TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS quota_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          current_limit INTEGER NOT NULL,
          requested_limit INTEGER NOT NULL,
          reason TEXT NOT NULL,
          supporting_doc_url TEXT,
          status TEXT DEFAULT 'pending',
          admin_remarks TEXT,
          reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          role TEXT,
          organization_id INTEGER,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'system',
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          user_role TEXT,
          action TEXT NOT NULL,
          entity_type TEXT,
          entity_id TEXT,
          details TEXT,
          ip_address TEXT,
          status TEXT DEFAULT 'success',
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

// Universal Query Interface supporting $1, $2 params & standard { rows, rowCount } response
async function query(sql, params = []) {
  if (dbMode === 'postgres' && pool) {
    const res = await pool.query(sql, params);
    return res;
  }

  // SQLite query conversion: convert $1, $2 to ? and handle RETURNING id or LAST_INSERT_ID
  return new Promise((resolve, reject) => {
    let sqliteSql = sql;
    let returning = false;

    // Check for RETURNING clause
    const returningMatch = sqliteSql.match(/RETURNING\s+([a-zA-Z0-9_*,\s]+)/i);
    if (returningMatch) {
      returning = true;
      sqliteSql = sqliteSql.replace(/RETURNING\s+([a-zA-Z0-9_*,\s]+)/i, '').trim();
    }

    // Convert $1, $2, etc. to ?
    sqliteSql = sqliteSql.replace(/\$(\d+)/g, '?');

    const trimmed = sqliteSql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
      sqliteDb.all(sqliteSql, params, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows: rows || [], rowCount: (rows || []).length });
      });
    } else {
      sqliteDb.run(sqliteSql, params, function (err) {
        if (err) return reject(err);
        const lastID = this.lastID;
        const changes = this.changes;

        if (returning && lastID) {
          // Fetch inserted record or return id
          resolve({
            rows: [{ id: lastID }],
            rowCount: changes,
            insertId: lastID,
          });
        } else {
          resolve({
            rows: [],
            rowCount: changes,
            insertId: lastID,
          });
        }
      });
    }
  });
}

module.exports = {
  initDb,
  query,
  getDbMode: () => dbMode,
};
