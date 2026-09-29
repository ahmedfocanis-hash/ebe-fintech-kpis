import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { KPIS } from './taxonomy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hybrid Database Adapter: Detect Vercel serverless environment vs Local / On-Premise
const isVercel = Boolean(
  process.env.VERCEL || 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.LAMBDA_TASK_ROOT || 
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
let DB_PATH;

if (isVercel) {
  DB_PATH = path.join('/tmp', 'kpis.db');
  const possiblePaths = [
    path.resolve(__dirname, '..', 'kpis.db'),
    path.resolve(process.cwd(), 'kpis.db'),
    path.join('/var', 'task', 'kpis.db')
  ];
  if (!fs.existsSync(DB_PATH)) {
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          fs.copyFileSync(p, DB_PATH);
          console.log('[Database] Vercel Cold-start: Copied seeded database from', p, 'to /tmp/kpis.db');
          break;
        } catch (err) {
          console.warn('[Database] Could not copy source database to /tmp:', err.message);
        }
      }
    }
  }
} else {
  DB_PATH = path.resolve(__dirname, '..', 'kpis.db');
}

export const db = new Database(DB_PATH);

if (!isVercel) {
  try {
    db.pragma('journal_mode = WAL');
  } catch (err) {
    console.warn('[Database] WAL mode setting:', err.message);
  }
}
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      password_hash TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL, -- 'EMPLOYEE', 'TEAM_LEAD', 'EXECUTIVE_AUDITOR'
      level TEXT,        -- 'Junior', 'Mid', 'Senior', 'Lead'
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
      level TEXT NOT NULL, -- 'Junior', 'Mid', 'Senior', 'Lead'
      weight REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scorecards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      period TEXT NOT NULL DEFAULT 'Q3 2026',
      status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Submitted', 'Reviewed', 'Audited', 'Needs Revision'
      self_submitted_at TEXT,
      reviewed_at TEXT,
      audited_at TEXT,
      manager_id INTEGER REFERENCES users(id),
      self_composite_score REAL DEFAULT 0,
      final_composite_score REAL DEFAULT 0,
      tier TEXT DEFAULT 'Pending', -- 'Top Performer', 'Solid Contributor', 'Needs Improvement', 'Pending'
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
      action TEXT NOT NULL, -- 'COMMENT', 'STATUS_CHANGE', 'REVISION_REQUESTED', 'APPROVED'
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('[Database] Initialized tables successfully at:', DB_PATH);

  // Migration: Ensure users has password_hash column
  try {
    db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT NULL;`);
    console.log('[Migration] Added password_hash column to users');
  } catch (err) {
    // Column already exists
  }

  // Migration: Ensure scorecard_items has auditor_comment column
  try {
    db.exec(`ALTER TABLE scorecard_items ADD COLUMN auditor_comment TEXT DEFAULT NULL;`);
    console.log('[Migration] Added auditor_comment column to scorecard_items');
  } catch (err) {
    // Column already exists
  }

  // Migration: Ensure Ahmed Hashim has an active scorecard with Lead weights
  ensureAhmedScorecard();
}

export function ensureAhmedScorecard() {
  try {
    const ahmed = db.prepare('SELECT id, name, role, level FROM users WHERE LOWER(email) = ? OR role = ?').get('a.hashim@ebetech.com.eg', 'TEAM_LEAD');
    if (!ahmed) return;

    // Check if Ahmed already has a scorecard
    const existingSc = db.prepare('SELECT id FROM scorecards WHERE user_id = ?').get(ahmed.id);
    if (!existingSc) {
      console.log('[Migration] Creating missing quarterly scorecard for Ahmed Hashim (Team Lead BA)...');
      const scRes = db.prepare(`
        INSERT INTO scorecards (
          user_id, period, status, self_submitted_at, reviewed_at, audited_at, manager_id,
          self_composite_score, final_composite_score, tier, overall_manager_notes
        ) VALUES (?, 'Q3 2026', 'Draft', null, null, null, null, 0.00, 0.00, null, null)
      `).run(ahmed.id);
      
      const scId = scRes.lastInsertRowid;
      const insertItem = db.prepare(`
        INSERT INTO scorecard_items (scorecard_id, kpi_id, self_score, manager_score, manager_notes, auditor_comment)
        VALUES (?, ?, null, null, null, null)
      `);

      KPIS.forEach(kpi => {
        insertItem.run(scId, kpi.id);
      });
      console.log('[Migration] Ahmed Hashim scorecard initialized successfully with all 27 criteria (ID: ' + scId + ').');
    }
  } catch (err) {
    console.error('[Migration Error]', err.message);
  }
}
