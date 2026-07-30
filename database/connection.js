const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// Priority: DB_PATH env var (Railway volume) → /tmp (Vercel) → local project root
function getDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  if (process.env.VERCEL || process.env.VERCEL_ENV) return '/tmp/financeiro.db';
  return path.join(__dirname, '..', 'financeiro.db');
}

const dbPath = getDbPath();
console.log('Database path:', dbPath);

// Create or open the database
const db = new DatabaseSync(dbPath);

module.exports = db;
