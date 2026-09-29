import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db.js';
import { CATEGORIES, KPIS, CATEGORY_WEIGHTS } from './taxonomy.js';

export async function seedDatabase() {
  console.log('[Seed] Starting database wipe and re-seeding with bcrypt-hashed credentials...');
  await initDatabase();

  // Wipe all existing tables
  await db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM scorecard_items;
    DELETE FROM scorecards;
    DELETE FROM category_weights;
    DELETE FROM kpis;
    DELETE FROM categories;
    DELETE FROM users;
  `);

  // Insert Categories
  const categoryStmts = CATEGORIES.map(c => ({
    sql: 'INSERT INTO categories (id, name, order_idx) VALUES (?, ?, ?)',
    args: [c.id, c.name, c.order_idx]
  }));
  await db.batch(categoryStmts);

  // Insert KPIs
  const kpiStmts = KPIS.map(k => ({
    sql: 'INSERT INTO kpis (id, category_id, code, title, tooltip, order_idx) VALUES (?, ?, ?, ?, ?, ?)',
    args: [k.id, k.category_id, k.code, k.title, k.tooltip, k.order_idx]
  }));
  await db.batch(kpiStmts);

  // Insert Category Weights
  const weightStmts = [];
  for (const [level, weights] of Object.entries(CATEGORY_WEIGHTS)) {
    for (const [catId, weight] of Object.entries(weights)) {
      weightStmts.push({
        sql: 'INSERT INTO category_weights (category_id, level, weight) VALUES (?, ?, ?)',
        args: [Number(catId), level, weight]
      });
    }
  }
  await db.batch(weightStmts);

  const SALT_ROUNDS = 10;

  // 1. Team Lead BA (Ahmed Hashim)
  const leadHash = bcrypt.hashSync('Hashim#Lead2026!', SALT_ROUNDS);
  const leadRes = await db.run(
    'INSERT INTO users (email, password, password_hash, name, role, level, department, title, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['a.hashim@ebetech.com.eg', leadHash, leadHash, 'Ahmed Hashim', 'TEAM_LEAD', 'Lead', 'Fintech Business Analysis', 'Team Lead BA', '/avatars/a.hashim.png']
  );
  const teamLeadId = leadRes.lastInsertRowid;

  // Initialize Ahmed Hashim's active quarterly scorecard (Lead Level)
  const ahmedScRes = await db.run(
    `INSERT INTO scorecards (
      user_id, period, status, self_submitted_at, reviewed_at, audited_at, manager_id,
      self_composite_score, final_composite_score, tier, overall_manager_notes
    ) VALUES (?, 'Q3 2026', 'Draft', null, null, null, null, 0.00, 0.00, null, null)`,
    [teamLeadId]
  );
  const ahmedScorecardId = ahmedScRes.lastInsertRowid;
  const ahmedItems = KPIS.map(kpi => ({
    sql: 'INSERT INTO scorecard_items (scorecard_id, kpi_id, self_score, manager_score, manager_notes, auditor_comment) VALUES (?, ?, null, null, null, null)',
    args: [ahmedScorecardId, kpi.id]
  }));
  await db.batch(ahmedItems);

  // 2. Executive Managers / Reviewers
  const nasserHash = bcrypt.hashSync('Nasser@Exec2026!', SALT_ROUNDS);
  await db.run(
    'INSERT INTO users (email, password, password_hash, name, role, level, department, title, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['a.nasser@ebetech.com.eg', nasserHash, nasserHash, 'Ahmed Nasser', 'EXECUTIVE_AUDITOR', 'Lead', 'Fintech Executive Management', 'Executive Manager', '/avatars/a.nasser.png']
  );

  const nourHash = bcrypt.hashSync('Asser#Audit2026!', SALT_ROUNDS);
  await db.run(
    'INSERT INTO users (email, password, password_hash, name, role, level, department, title, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['nour.asser@ebe.com.eg', nourHash, nourHash, 'Nour Asser', 'EXECUTIVE_AUDITOR', 'Lead', 'Fintech Executive Management', 'Executive Manager', '/avatars/nour.asser.png']
  );

  // 3. Business Analysts (Employees)
  const baList = [
    {
      name: 'Yousef Ali',
      email: 'youssif.ali@ebetech.com.eg',
      plainPass: 'Yousef*Sr2026!',
      role: 'EMPLOYEE',
      level: 'Senior',
      title: 'Senior Business Analyst',
      avatar: '/avatars/youssif.ali.png'
    },
    {
      name: 'ALy Alaa',
      email: 'aly.alaaEldin@ebetech.com.eg',
      plainPass: 'Aly@Jr2026!',
      role: 'EMPLOYEE',
      level: 'Junior',
      title: 'Junior Business Analyst',
      avatar: '/avatars/aly.alaaEldin.png'
    },
    {
      name: 'Rawan Mohamed',
      email: 'rawan.mohamed@ebe.com.eg',
      plainPass: 'Rawan#Jr2026!',
      role: 'EMPLOYEE',
      level: 'Junior',
      title: 'Junior Business Analyst',
      avatar: '/avatars/rawan.mohamed.png'
    }
  ];

  for (const ba of baList) {
    const userHash = bcrypt.hashSync(ba.plainPass, SALT_ROUNDS);
    const userRes = await db.run(
      'INSERT INTO users (email, password, password_hash, name, role, level, department, title, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ba.email, userHash, userHash, ba.name, ba.role, ba.level, 'Fintech Business Analysis', ba.title, ba.avatar]
    );
    const userId = userRes.lastInsertRowid;

    const scRes = await db.run(
      `INSERT INTO scorecards (
        user_id, period, status, self_submitted_at, reviewed_at, audited_at, manager_id,
        self_composite_score, final_composite_score, tier, overall_manager_notes
      ) VALUES (?, 'Q3 2026', 'Draft', null, null, null, null, 0.00, 0.00, null, null)`,
      [userId]
    );
    const scorecardId = scRes.lastInsertRowid;

    const items = KPIS.map(kpi => ({
      sql: 'INSERT INTO scorecard_items (scorecard_id, kpi_id, self_score, manager_score, manager_notes, auditor_comment) VALUES (?, ?, null, null, null, null)',
      args: [scorecardId, kpi.id]
    }));
    await db.batch(items);
  }

  console.log('[Seed] Database wiped and re-seeded successfully with 6 users, 10-round salted bcrypt hashes, and active scorecards.');
}

if (process.argv[1] && (process.argv[1].endsWith('seed.js') || process.argv[1].includes('seed.js'))) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
