import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db.js';
import { CATEGORIES, KPIS, CATEGORY_WEIGHTS } from './taxonomy.js';

export function seedDatabase() {
  console.log('[Seed] Starting database wipe and re-seeding with bcrypt-hashed credentials...');
  initDatabase();

  // Wipe all existing tables
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM scorecard_items;
    DELETE FROM scorecards;
    DELETE FROM category_weights;
    DELETE FROM kpis;
    DELETE FROM categories;
    DELETE FROM users;
  `);

  // Insert Categories
  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, order_idx) VALUES (?, ?, ?)
  `);
  CATEGORIES.forEach(c => insertCategory.run(c.id, c.name, c.order_idx));

  // Insert KPIs
  const insertKpi = db.prepare(`
    INSERT INTO kpis (id, category_id, code, title, tooltip, order_idx)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  KPIS.forEach(k => insertKpi.run(k.id, k.category_id, k.code, k.title, k.tooltip, k.order_idx));

  // Insert Category Weights
  const insertWeight = db.prepare(`
    INSERT INTO category_weights (category_id, level, weight)
    VALUES (?, ?, ?)
  `);
  for (const [level, weights] of Object.entries(CATEGORY_WEIGHTS)) {
    for (const [catId, weight] of Object.entries(weights)) {
      insertWeight.run(Number(catId), level, weight);
    }
  }

  // Insert Users with 10-round salted bcrypt hashes
  const insertUser = db.prepare(`
    INSERT INTO users (email, password, password_hash, name, role, level, department, title, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertScorecard = db.prepare(`
    INSERT INTO scorecards (
      user_id, period, status, self_submitted_at, reviewed_at, audited_at, manager_id,
      self_composite_score, final_composite_score, tier, overall_manager_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertScorecardItem = db.prepare(`
    INSERT INTO scorecard_items (scorecard_id, kpi_id, self_score, manager_score, manager_notes, auditor_comment)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const SALT_ROUNDS = 10;

  // 1. Team Lead BA (Ahmed Hashim)
  const leadHash = bcrypt.hashSync('Hashim#Lead2026!', SALT_ROUNDS);
  const leadRes = insertUser.run(
    'a.hashim@ebetech.com.eg',
    leadHash,
    leadHash,
    'Ahmed Hashim',
    'TEAM_LEAD',
    'Lead',
    'Fintech Business Analysis',
    'Team Lead BA',
    '/avatars/a.hashim.png'
  );
  const teamLeadId = leadRes.lastInsertRowid;

  // Initialize Ahmed Hashim's active quarterly scorecard (Lead Level)
  const ahmedScRes = insertScorecard.run(
    teamLeadId,
    'Q3 2026',
    'Draft',
    null,
    null,
    null,
    null,
    0.00,
    0.00,
    null,
    null
  );
  const ahmedScorecardId = ahmedScRes.lastInsertRowid;
  KPIS.forEach(kpi => {
    insertScorecardItem.run(ahmedScorecardId, kpi.id, null, null, null, null);
  });

  // 2. Executive Managers / Reviewers
  const nasserHash = bcrypt.hashSync('Nasser@Exec2026!', SALT_ROUNDS);
  insertUser.run(
    'a.nasser@ebetech.com.eg',
    nasserHash,
    nasserHash,
    'Ahmed Nasser',
    'EXECUTIVE_AUDITOR',
    'Lead',
    'Fintech Executive Management',
    'Executive Manager',
    '/avatars/a.nasser.png'
  );

  const nourHash = bcrypt.hashSync('Asser#Audit2026!', SALT_ROUNDS);
  insertUser.run(
    'nour.asser@ebe.com.eg',
    nourHash,
    nourHash,
    'Nour Asser',
    'EXECUTIVE_AUDITOR',
    'Lead',
    'Fintech Executive Management',
    'Executive Manager',
    '/avatars/nour.asser.png'
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

  baList.forEach((ba) => {
    const userHash = bcrypt.hashSync(ba.plainPass, SALT_ROUNDS);
    const userRes = insertUser.run(
      ba.email,
      userHash,
      userHash,
      ba.name,
      ba.role,
      ba.level,
      'Fintech Business Analysis',
      ba.title,
      ba.avatar
    );
    const userId = userRes.lastInsertRowid;

    // Blank quarterly scorecard ready for self-assessment
    const scRes = insertScorecard.run(
      userId,
      'Q3 2026',
      'Draft',
      null,
      null,
      null,
      teamLeadId,
      0.00,
      0.00,
      null,
      null
    );
    const scorecardId = scRes.lastInsertRowid;

    // Insert all 27 items with null score (ready for employee self-assessment)
    KPIS.forEach((kpi) => {
      insertScorecardItem.run(scorecardId, kpi.id, null, null, null, null);
    });
  });

  console.log('[Seed] Database wiped and re-seeded successfully with 6 users, 10-round salted bcrypt hashes, and active scorecards.');
}

// Allow direct execution
if (process.argv[1] && (process.argv[1].endsWith('seed.js') || process.argv[1].includes('seed.js'))) {
  seedDatabase();
  process.exit(0);
}
