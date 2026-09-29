import 'dotenv/config';
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function syncToTurso() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.argv[2];
  const tursoToken = process.env.TURSO_AUTH_TOKEN || process.argv[3];

  if (!tursoUrl) {
    console.error('========================================================================');
    console.error('ERROR: TURSO_DATABASE_URL is not set.');
    console.error('Usage:');
    console.error('  node server/sync_to_turso.js <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>');
    console.error('Or add them to your .env file:');
    console.error('  TURSO_DATABASE_URL=libsql://your-db.turso.io');
    console.error('  TURSO_AUTH_TOKEN=your-token');
    console.error('========================================================================');
    process.exit(1);
  }

  console.log(`[Sync] Reading local SQLite database at kpis.db...`);
  const localDb = path.resolve(__dirname, '..', 'kpis.db');
  const localClient = createClient({ url: `file:${localDb}` });

  console.log(`[Sync] Connecting to remote Turso database (${tursoUrl})...`);
  const remoteClient = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  console.log(`[Sync] Creating tables on Turso if not present...`);
  await remoteClient.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      password_hash TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      level TEXT,
      department TEXT DEFAULT 'Fintech Business Analysis',
      title TEXT,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      order_idx INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kpis (
      id INTEGER PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      tooltip TEXT NOT NULL,
      order_idx INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS category_weights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      level TEXT NOT NULL,
      weight REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scorecards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      period TEXT NOT NULL DEFAULT 'Q3 2026',
      status TEXT NOT NULL DEFAULT 'Draft',
      self_submitted_at TEXT,
      reviewed_at TEXT,
      audited_at TEXT,
      manager_id INTEGER REFERENCES users(id),
      self_composite_score REAL DEFAULT 0,
      final_composite_score REAL DEFAULT 0,
      tier TEXT DEFAULT 'Pending',
      overall_manager_notes TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scorecard_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scorecard_id INTEGER NOT NULL REFERENCES scorecards(id) ON DELETE CASCADE,
      kpi_id INTEGER NOT NULL REFERENCES kpis(id),
      self_score REAL DEFAULT 0,
      manager_score REAL DEFAULT 0,
      manager_notes TEXT DEFAULT '',
      auditor_comment TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scorecard_id INTEGER NOT NULL REFERENCES scorecards(id) ON DELETE CASCADE,
      author_id INTEGER REFERENCES users(id),
      author_name TEXT NOT NULL,
      action TEXT NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const tables = ['users', 'categories', 'kpis', 'category_weights', 'scorecards', 'scorecard_items', 'audit_logs'];

  for (const table of tables) {
    const localRows = (await localClient.execute(`SELECT * FROM ${table}`)).rows;
    console.log(`[Sync] Found ${localRows.length} rows in local '${table}' table.`);

    if (localRows.length === 0) continue;

    // Check columns
    const columns = Object.keys(localRows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const colList = columns.join(', ');

    // Use chunks of 50 statements for batching
    const chunkSize = 50;
    for (let i = 0; i < localRows.length; i += chunkSize) {
      const chunk = localRows.slice(i, i + chunkSize);
      const batchStmts = chunk.map(row => ({
        sql: `INSERT OR REPLACE INTO ${table} (${colList}) VALUES (${placeholders})`,
        args: columns.map(c => row[c])
      }));
      await remoteClient.batch(batchStmts, 'write');
    }
    console.log(`[Sync] -> Synchronized ${localRows.length} rows to Turso '${table}' table.`);
  }

  console.log('========================================================================');
  console.log('SUCCESS! Local database successfully synchronized to Turso Cloud.');
  console.log('Now set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel Environment Variables:');
  console.log('  vercel env add TURSO_DATABASE_URL');
  console.log('  vercel env add TURSO_AUTH_TOKEN');
  console.log('========================================================================');
}

syncToTurso().catch(err => {
  console.error('[Sync Error]', err);
  process.exit(1);
});
