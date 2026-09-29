import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { KPIS } from './taxonomy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isServerless = Boolean(
  process.env.VERCEL || 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.LAMBDA_TASK_ROOT || 
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);

export const isTurso = Boolean(process.env.TURSO_DATABASE_URL);

let dbUrl;
if (isTurso) {
  dbUrl = process.env.TURSO_DATABASE_URL;
} else if (isServerless) {
  // If running on Vercel serverless without Turso, fallback to /tmp/kpis.db
  const tmpDbPath = path.join('/tmp', 'kpis.db');
  const possiblePaths = [
    path.resolve(__dirname, '..', 'kpis.db'),
    path.resolve(process.cwd(), 'kpis.db'),
    path.join('/var', 'task', 'kpis.db')
  ];
  if (!fs.existsSync(tmpDbPath)) {
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          fs.copyFileSync(p, tmpDbPath);
          console.log('[Database] Cold-start: Copied baseline database from', p, 'to', tmpDbPath);
          break;
        } catch (err) {
          console.warn('[Database] Could not copy database to /tmp:', err.message);
        }
      }
    }
  }
  dbUrl = `file:${tmpDbPath}`;
} else {
  // Local environment: persistent kpis.db in project root
  const localDb = path.resolve(__dirname, '..', 'kpis.db');
  dbUrl = `file:${localDb}`;
}

export const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

console.log(`[Database] Connected via LibSQL (${isTurso ? 'Turso Cloud' : dbUrl})`);

// Universal async helper methods
export const db = {
  client,

  async all(sql, args = []) {
    const res = await client.execute({ sql, args });
    return Array.from(res.rows);
  },

  async get(sql, args = []) {
    const res = await client.execute({ sql, args });
    return res.rows[0] || null;
  },

  async run(sql, args = []) {
    const res = await client.execute({ sql, args });
    return {
      lastInsertRowid: res.lastInsertRowid,
      rowsAffected: res.rowsAffected
    };
  },

  async exec(sql) {
    return await client.executeMultiple(sql);
  },

  async batch(statements, mode = 'write') {
    return await client.batch(statements, mode);
  }
};

export async function initDatabase() {
  await db.exec(`
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
  console.log('[Database] Initialized tables successfully via LibSQL');

  // Migrations
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT NULL;`);
  } catch (e) {}

  try {
    await db.exec(`ALTER TABLE scorecard_items ADD COLUMN auditor_comment TEXT DEFAULT NULL;`);
  } catch (e) {}

  await ensureAhmedScorecard();
}

export async function ensureAhmedScorecard() {
  try {
    const ahmed = await db.get('SELECT id, name, role, level FROM users WHERE LOWER(email) = ? OR role = ?', ['a.hashim@ebetech.com.eg', 'TEAM_LEAD']);
    if (!ahmed) return;

    const existingSc = await db.get('SELECT id FROM scorecards WHERE user_id = ?', [ahmed.id]);
    if (!existingSc) {
      console.log('[Migration] Creating missing quarterly scorecard for Ahmed Hashim (Team Lead BA)...');
      const scRes = await db.run(`
        INSERT INTO scorecards (
          user_id, period, status, self_submitted_at, reviewed_at, audited_at, manager_id,
          self_composite_score, final_composite_score, tier, overall_manager_notes
        ) VALUES (?, 'Q3 2026', 'Draft', null, null, null, null, 0.00, 0.00, null, null)
      `, [ahmed.id]);

      const scId = scRes.lastInsertRowid;
      const batchStmts = KPIS.map(kpi => ({
        sql: `INSERT INTO scorecard_items (scorecard_id, kpi_id, self_score, manager_score, manager_notes, auditor_comment) VALUES (?, ?, null, null, null, null)`,
        args: [scId, kpi.id]
      }));
      await db.batch(batchStmts);
      console.log('[Migration] Ahmed Hashim scorecard initialized successfully with all 27 criteria (ID: ' + scId + ').');
    }
  } catch (err) {
    console.error('[Migration Error]', err.message);
  }
}

export default {
  client,
  db,
  isTurso,
  initDatabase,
  ensureAhmedScorecard
};
