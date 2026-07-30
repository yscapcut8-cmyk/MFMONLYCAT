const db = require('./connection');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      type TEXT NOT NULL, -- 'income' or 'expense'
      amount REAL NOT NULL,
      date DATE NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1), -- Only one row allowed
      company_pct REAL NOT NULL DEFAULT 10,
      ortiz_pct REAL NOT NULL DEFAULT 45,
      davi_pct REAL NOT NULL DEFAULT 45
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS company_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      type TEXT NOT NULL, -- 'income' or 'expense'
      amount REAL NOT NULL,
      date DATE NOT NULL,
      subscription_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions (id)
    );
    
    INSERT OR IGNORE INTO settings (id, company_pct, ortiz_pct, davi_pct) VALUES (1, 10, 45, 45);
  `);
  
  // Migration for adding status column to existing db
  try {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'");
    // Since this is executed, it means we just added the column to an existing db
    // Let's set existing users to 'approved' to avoid locking out existing ones, or just the admin.
    db.exec("UPDATE users SET status = 'approved'");
  } catch (e) {
    // Column already exists, ignore
  }

  // Ensure admin is always approved
  db.exec("UPDATE users SET status = 'approved' WHERE role = 'admin' OR email = 'yscapcut8@gmail.com'");

  console.log('Database initialized.');
}

initDb();
module.exports = db;
