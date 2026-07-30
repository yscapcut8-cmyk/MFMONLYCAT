const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// On Vercel/serverless: use /tmp (writable), otherwise use project root
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
const dbDir = isVercel ? '/tmp' : path.join(__dirname, '..');
const dbPath = path.join(dbDir, 'financeiro.db');

// Create or open the database
const db = new DatabaseSync(dbPath);

module.exports = db;
