const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Priority: DB_PATH env var (Railway volume) → /tmp (Vercel) → local project root
function getDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  if (process.env.VERCEL || process.env.VERCEL_ENV) return '/tmp/financeiro.db';
  return path.join(__dirname, '..', 'financeiro.db');
}

const dbPath = getDbPath();
console.log('Database path:', dbPath);

// Ensure the directory exists (required for Railway volumes)
const dbDir = path.dirname(dbPath);
fs.mkdirSync(dbDir, { recursive: true });

// Create or open the database
const db = new DatabaseSync(dbPath);

module.exports = db;
