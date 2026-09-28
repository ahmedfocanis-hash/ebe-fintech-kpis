import { db } from './db.js';

export function resetScorecardsToCleanDraft() {
  console.log('[Reset] Resetting all scorecards to clean Draft status...');

  // 1. Reset Scorecard Records
  db.prepare(`
    UPDATE scorecards SET
      status = 'Draft',
      self_composite_score = 0.00,
      final_composite_score = 0.00,
      tier = NULL,
      overall_manager_notes = NULL,
      self_submitted_at = NULL,
      reviewed_at = NULL,
      audited_at = NULL
  `).run();

  // 2. Clear All Scorecard Items
  db.prepare(`
    UPDATE scorecard_items SET
      self_score = NULL,
      manager_score = NULL,
      manager_notes = NULL,
      auditor_comment = NULL
  `).run();

  // 3. Wipe Audit Logs
  db.prepare('DELETE FROM audit_logs').run();

  // 4. Persist & Checkpoint SQLite
  db.pragma('wal_checkpoint(TRUNCATE)');

  console.log('--- VERIFICATION ---');
  const scorecards = db.prepare(`
    SELECT s.id, s.user_id, u.name, u.role, s.status, s.self_composite_score, s.final_composite_score, s.tier, s.overall_manager_notes
    FROM scorecards s
    JOIN users u ON s.user_id = u.id
  `).all();
  console.log('Scorecards:', JSON.stringify(scorecards, null, 2));

  const scoredItems = db.prepare(`
    SELECT count(*) as count 
    FROM scorecard_items 
    WHERE self_score IS NOT NULL 
       OR manager_score IS NOT NULL 
       OR manager_notes IS NOT NULL 
       OR auditor_comment IS NOT NULL
  `).get();
  console.log('Non-null items count (must be 0):', scoredItems.count);

  const auditLogsCount = db.prepare('SELECT count(*) as count FROM audit_logs').get();
  console.log('Audit logs count (must be 0):', auditLogsCount.count);
}

resetScorecardsToCleanDraft();
