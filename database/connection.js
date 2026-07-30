const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Priority: DB_PATH env var → /data (Railway) → /tmp (Vercel) → local project root
function getDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) return '/data/financeiro.db';
  if (process.env.VERCEL || process.env.VERCEL_ENV) return '/tmp/financeiro.db';
  return path.join(__dirname, '..', 'financeiro.db');
}

const dbPath = getDbPath();
console.log('[DB] Database path:', dbPath);

// Ensure the directory exists (required for Railway volumes and first run)
const dbDir = path.dirname(dbPath);
try {
  fs.mkdirSync(dbDir, { recursive: true });
} catch (e) {
  console.warn('[DB] Could not create db dir:', e.message);
}

// Create or open the database
const db = new DatabaseSync(dbPath);

module.exports = db;
