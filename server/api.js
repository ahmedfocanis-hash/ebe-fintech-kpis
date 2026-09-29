import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { db } from './db.js';
import { CATEGORIES, KPIS, CATEGORY_WEIGHTS } from './taxonomy.js';
import { calculateScorecard } from './calculator.js';
import { seedDatabase } from './seed.js';
import { writeProductionLog } from './logger.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ebe_fintech_kpi_jwt_secret_2026_prod';

// Rate Limiter: Max 15 login attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many login attempts from this IP, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware: Authenticate JWT Token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
}

// GET /api/users - Get all users for quick login / demo switching
router.get('/users', async (req, res) => {
  try {
    const users = await db.all(`
      SELECT id, email, name, role, level, department, title, avatar
      FROM users
      ORDER BY 
        CASE role 
          WHEN 'TEAM_LEAD' THEN 1 
          WHEN 'EXECUTIVE_AUDITOR' THEN 2 
          ELSE 3 
        END,
        id ASC
    `);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login - Secure login with bcrypt verification & JWT issuance
router.post('/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password, userId } = req.body;
    let user;

    if (email) {
      user = await db.get(`
        SELECT id, email, name, role, level, department, title, avatar, password, password_hash
        FROM users 
        WHERE LOWER(email) = LOWER(?)
      `, [email]);
    } else if (userId) {
      user = await db.get(`
        SELECT id, email, name, role, level, department, title, avatar, password, password_hash
        FROM users 
        WHERE id = ?
      `, [userId]);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or user credentials' });
    }

    const hashToCompare = user.password_hash || user.password;
    if (password) {
      const isMatch = bcrypt.compareSync(password, hashToCompare);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }
    } else if (!userId) {
      return res.status(400).json({ success: false, message: 'Password required' });
    }

    // Generate signed JWT token valid for 24 hours
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      level: user.level
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    // Omit sensitive password fields
    const { password: _, password_hash: __, ...userData } = user;
    res.json({ success: true, token, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/taxonomy - Categories, KPIs, Weights (Public reference)
router.get('/taxonomy', (req, res) => {
  res.json({
    success: true,
    categories: CATEGORIES,
    kpis: KPIS,
    weights: CATEGORY_WEIGHTS
  });
});

// GET /api/scorecards - List scorecards with RBAC filtering
router.get('/scorecards', authenticateToken, async (req, res) => {
  try {
    const { status, level, search } = req.query;

    let query = `
      SELECT 
        s.id, s.user_id, s.period, s.status, s.self_submitted_at, s.reviewed_at, s.audited_at,
        s.manager_id, 
        COALESCE(s.self_composite_score, 0.0) as self_composite_score, 
        COALESCE(s.final_composite_score, 0.0) as final_composite_score, 
        COALESCE(s.tier, 'Pending') as tier, 
        s.overall_manager_notes,
        s.updated_at,
        u.name as employee_name, u.email as employee_email, u.level as employee_level,
        u.title as employee_title, u.avatar as employee_avatar, u.role as employee_role,
        m.name as manager_name
      FROM scorecards s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users m ON s.manager_id = m.id
      WHERE s.id IN (
        SELECT MAX(id) FROM scorecards GROUP BY user_id
      )
    `;
    const params = [];

    // RBAC:
    if (req.user.role === 'TEAM_LEAD') {
      // Explicitly fetch ALL scorecards for ALL employees (where user role is 'EMPLOYEE'),
      // plus the Team Lead's own scorecard (for self-assessment tab), regardless of their current status!
      query += ` AND (u.role = 'EMPLOYEE' OR s.user_id = ?)`;
      params.push(req.user.id);
    } else if (req.user.role === 'EMPLOYEE') {
      // Ensure the employee's fetch query returns their scorecard safely in ALL statuses ('Draft', 'Submitted', 'Reviewed', 'Needs Revision', 'Audited')
      query += ` AND s.user_id = ?`;
      params.push(req.user.id);
    } else {
      // For Executive Auditors or others, apply status filter if passed
      if (status && status !== 'All') {
        query += ` AND s.status = ?`;
        params.push(status);
      }
    }

    if (level && level !== 'All') {
      query += ` AND u.level = ?`;
      params.push(level);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY s.final_composite_score DESC, s.id ASC`;

    const scorecards = await db.all(query, params);
    res.json({ success: true, scorecards });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/scorecards/user/:userId - Get employee's active scorecard with RBAC
router.get('/scorecards/user/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = Number(req.params.userId);

    // RBAC: Employee can only view their own scorecard
    if (req.user.role === 'EMPLOYEE' && req.user.id !== targetUserId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own scorecard' });
    }

    const scorecard = await db.get(`
      SELECT 
        s.*,
        COALESCE(s.self_composite_score, 0.0) as self_composite_score,
        COALESCE(s.final_composite_score, 0.0) as final_composite_score,
        COALESCE(s.tier, 'Pending') as tier,
        u.name as employee_name, u.email as employee_email, u.level as employee_level,
        u.title as employee_title, u.avatar as employee_avatar, u.role as employee_role, u.department,
        m.name as manager_name
      FROM scorecards s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users m ON s.manager_id = m.id
      WHERE s.user_id = ?
      ORDER BY s.id DESC
      LIMIT 1
    `, [targetUserId]);

    if (!scorecard) {
      return res.status(404).json({ success: false, message: 'Scorecard not found for user' });
    }

    // Get Items
    const items = await db.all(`
      SELECT 
        si.*,
        COALESCE(si.self_score, 0) as self_score,
        COALESCE(si.manager_score, 0) as manager_score,
        k.code, k.title, k.tooltip, k.category_id, k.order_idx
      FROM scorecard_items si
      JOIN kpis k ON si.kpi_id = k.id
      WHERE si.scorecard_id = ?
      ORDER BY k.category_id ASC, k.order_idx ASC
    `, [scorecard.id]);

    // Dynamic Calculations
    const calculations = calculateScorecard(
      scorecard.employee_level, 
      items, 
      scorecard.status === 'Draft' || scorecard.status === 'Submitted' ? 'self' : 'manager'
    );
    const selfCalculations = calculateScorecard(scorecard.employee_level, items, 'self');
    const managerCalculations = calculateScorecard(scorecard.employee_level, items, 'manager');

    // Get Audit Logs
    const auditLogs = await db.all(`
      SELECT * FROM audit_logs WHERE scorecard_id = ? ORDER BY created_at ASC
    `, [scorecard.id]);

    res.json({
      success: true,
      scorecard: {
        ...scorecard,
        items,
        calculations,
        selfCalculations,
        managerCalculations,
        auditLogs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/scorecards/:id - Detailed Scorecard with RBAC
router.get('/scorecards/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const scorecard = await db.get(`
      SELECT 
        s.*,
        COALESCE(s.self_composite_score, 0.0) as self_composite_score,
        COALESCE(s.final_composite_score, 0.0) as final_composite_score,
        COALESCE(s.tier, 'Pending') as tier,
        u.name as employee_name, u.email as employee_email, u.level as employee_level,
        u.title as employee_title, u.avatar as employee_avatar, u.role as employee_role, u.department,
        m.name as manager_name
      FROM scorecards s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users m ON s.manager_id = m.id
      WHERE s.id = ?
    `, [id]);

    if (!scorecard) {
      return res.status(404).json({ success: false, message: 'Scorecard not found' });
    }

    // RBAC: Employee can only view their own scorecard
    if (req.user.role === 'EMPLOYEE' && req.user.id !== scorecard.user_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own scorecard' });
    }

    // Get Items
    const items = await db.all(`
      SELECT 
        si.*,
        COALESCE(si.self_score, 0) as self_score,
        COALESCE(si.manager_score, 0) as manager_score,
        k.code, k.title, k.tooltip, k.category_id, k.order_idx
      FROM scorecard_items si
      JOIN kpis k ON si.kpi_id = k.id
      WHERE si.scorecard_id = ?
      ORDER BY k.category_id ASC, k.order_idx ASC
    `, [scorecard.id]);

    // Dynamic Calculations
    const calculations = calculateScorecard(
      scorecard.employee_level, 
      items, 
      scorecard.status === 'Draft' || scorecard.status === 'Submitted' ? 'self' : 'manager'
    );
    const selfCalculations = calculateScorecard(scorecard.employee_level, items, 'self');
    const managerCalculations = calculateScorecard(scorecard.employee_level, items, 'manager');

    // Get Audit Logs
    const auditLogs = await db.all(`
      SELECT * FROM audit_logs WHERE scorecard_id = ? ORDER BY created_at ASC
    `, [scorecard.id]);

    res.json({
      success: true,
      scorecard: {
        ...scorecard,
        items,
        calculations,
        selfCalculations,
        managerCalculations,
        auditLogs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/scorecards/:id/self-ratings - Save Draft Self Ratings with RBAC
router.put('/scorecards/:id/self-ratings', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const scorecard = await db.get(`
      SELECT s.*, u.level as employee_level
      FROM scorecards s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!scorecard) {
      return res.status(404).json({ success: false, message: 'Scorecard not found' });
    }

    // RBAC: User must own the scorecard
    if (req.user.id !== scorecard.user_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only modify your own self-ratings' });
    }

    if (scorecard.status === 'Reviewed' || scorecard.status === 'Audited') {
      return res.status(400).json({ success: false, message: 'Cannot modify self-ratings after manager review is finalized.' });
    }

    if (items && Array.isArray(items) && items.length > 0) {
      const batchStmts = items.map(item => ({
        sql: `UPDATE scorecard_items SET self_score = ? WHERE scorecard_id = ? AND kpi_id = ?`,
        args: [Number(item.self_score) || 0, id, item.kpi_id]
      }));
      await db.batch(batchStmts);
    }

    // Recalculate self score
    const updatedItems = await db.all(`SELECT * FROM scorecard_items WHERE scorecard_id = ?`, [id]);
    const selfCalc = calculateScorecard(scorecard.employee_level, updatedItems, 'self');

    await db.run(`
      UPDATE scorecards
      SET self_composite_score = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [selfCalc.composite_score, id]);

    res.json({
      success: true,
      message: 'Self-ratings saved successfully',
      self_composite_score: selfCalc.composite_score,
      selfCalculations: selfCalc
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/scorecards/:id/submit - Submit for Review with RBAC
router.post('/scorecards/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { items, authorName, authorId } = req.body;

    const scorecard = await db.get(`
      SELECT s.*, u.level as employee_level, u.name as employee_name, u.role as employee_role
      FROM scorecards s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!scorecard) {
      return res.status(404).json({ success: false, message: 'Scorecard not found' });
    }

    // RBAC: User must own the scorecard
    if (req.user.id !== scorecard.user_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only submit your own scorecard' });
    }

    // Save any pending items first if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const batchStmts = items.map(item => ({
        sql: `UPDATE scorecard_items SET self_score = ? WHERE scorecard_id = ? AND kpi_id = ?`,
        args: [Number(item.self_score) || 0, id, item.kpi_id]
      }));
      await db.batch(batchStmts);
    }

    const currentItems = await db.all(`SELECT * FROM scorecard_items WHERE scorecard_id = ?`, [id]);
    const selfCalc = calculateScorecard(scorecard.employee_level, currentItems, 'self');

    // Update status to Submitted
    const oldStatus = scorecard.status;
    await db.run(`
      UPDATE scorecards
      SET status = 'Submitted',
          self_submitted_at = CURRENT_TIMESTAMP,
          self_composite_score = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [selfCalc.composite_score, id]);

    // Log explicit state transition to production.log and console
    req._transitionLogged = true;
    writeProductionLog(`Scorecard ${id} transitioned from ${oldStatus} to Submitted by ${scorecard.employee_name}`, req, 200);

    // Insert audit log
    const isLeadEvaluation = scorecard.employee_role === 'TEAM_LEAD' || scorecard.employee_level === 'Lead';
    const logComment = isLeadEvaluation
      ? `Submitted Team Lead self-evaluation with projected score of ${selfCalc.composite_score} to Executive Management (Ahmed Nasser & Nour Asser).`
      : `Submitted self-evaluation with projected score of ${selfCalc.composite_score} for Team Lead review.`;

    await db.run(`
      INSERT INTO audit_logs (scorecard_id, author_id, author_name, action, comment, created_at)
      VALUES (?, ?, ?, 'STATUS_CHANGE', ?, CURRENT_TIMESTAMP)
    `, [
      id,
      authorId || scorecard.user_id,
      authorName || scorecard.employee_name,
      logComment
    ]);

    res.json({
      success: true,
      message: isLeadEvaluation
        ? 'Evaluation submitted to Executive Management (Ahmed Nasser & Nour Asser)'
        : 'Scorecard submitted for Team Lead review',
      status: 'Submitted',
      self_composite_score: selfCalc.composite_score
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/scorecards/:id/manager-review - Save Manager Review with RBAC
router.put('/scorecards/:id/manager-review', authenticateToken, async (req, res) => {
  try {
    // RBAC: Team Lead or Executive Auditor only
    if (req.user.role !== 'TEAM_LEAD' && req.user.role !== 'EXECUTIVE_AUDITOR') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only Team Lead or Executive Management can conduct manager reviews' });
    }

    const { id } = req.params;
    const { items, overall_manager_notes, managerId } = req.body;

    const scorecard = await db.get(`
      SELECT s.*, u.level as employee_level
      FROM scorecards s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!scorecard) {
      return res.status(404).json({ success: false, message: 'Scorecard not found' });
    }

    if (items && Array.isArray(items) && items.length > 0) {
      const batchStmts = items.map(item => ({
        sql: `UPDATE scorecard_items SET manager_score = ?, manager_notes = ? WHERE scorecard_id = ? AND kpi_id = ?`,
        args: [
          Number(item.manager_score) || 0,
          item.manager_notes || '',
          id,
          item.kpi_id
        ]
      }));
      await db.batch(batchStmts);
    }

    const updatedItems = await db.all(`SELECT * FROM scorecard_items WHERE scorecard_id = ?`, [id]);
    const mgrCalc = calculateScorecard(scorecard.employee_level, updatedItems, 'manager');

    await db.run(`
      UPDATE scorecards
      SET final_composite_score = ?,
          tier = ?,
          overall_manager_notes = COALESCE(?, overall_manager_notes),
          manager_id = COALESCE(?, manager_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      mgrCalc.composite_score,
      mgrCalc.tier,
      overall_manager_notes,
      managerId || req.user.id,
      id
    ]);

    req._transitionLogged = true;
    writeProductionLog(`Scorecard ${id} manager review updated by ${req.user.name || 'Ahmed Hashim'} (Score: ${mgrCalc.composite_score})`, req, 200);

    res.json({
      success: true,
      message: 'Manager review draft saved',
      final_composite_score: mgrCalc.composite_score,
      tier: mgrCalc.tier,
      managerCalculations: mgrCalc
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/scorecards/:id/finalize - Finalize & Send to Management with RBAC
router.post('/scorecards/:id/finalize', authenticateToken, async (req, res) => {
  try {
    // RBAC: Team Lead or Executive Auditor only
    if (req.user.role !== 'TEAM_LEAD' && req.user.role !== 'EXECUTIVE_AUDITOR') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only Team Lead or Executive Management can finalize reviews' });
    }

    const { id } = req.params;
    const { items, overall_manager_notes, managerId, managerName } = req.body;

    const scorecard = await db.get(`
      SELECT s.*, u.level as employee_level, u.name as employee_name
      FROM scorecards s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!scorecard) {
      return res.status(404).json({ success: false, message: 'Scorecard not found' });
    }

    if (items && Array.isArray(items) && items.length > 0) {
      const batchStmts = items.map(item => ({
        sql: `UPDATE scorecard_items SET manager_score = ?, manager_notes = ? WHERE scorecard_id = ? AND kpi_id = ?`,
        args: [
          Number(item.manager_score) || 0,
          item.manager_notes || '',
          id,
          item.kpi_id
        ]
      }));
      await db.batch(batchStmts);
    }

    const currentItems = await db.all(`SELECT * FROM scorecard_items WHERE scorecard_id = ?`, [id]);
    const mgrCalc = calculateScorecard(scorecard.employee_level, currentItems, 'manager');

    const oldStatus = scorecard.status;
    await db.run(`
      UPDATE scorecards
      SET status = 'Reviewed',
          reviewed_at = CURRENT_TIMESTAMP,
          manager_id = ?,
          final_composite_score = ?,
          tier = ?,
          overall_manager_notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      managerId || req.user.id,
      mgrCalc.composite_score,
      mgrCalc.tier,
      overall_manager_notes || '',
      id
    ]);

    // Log explicit state transition to production.log and console
    req._transitionLogged = true;
    writeProductionLog(`Scorecard ${id} transitioned from ${oldStatus} to Reviewed by ${managerName || req.user.name || 'Ahmed Hashim'}`, req, 200);

    // Insert audit log
    await db.run(`
      INSERT INTO audit_logs (scorecard_id, author_id, author_name, action, comment, created_at)
      VALUES (?, ?, ?, 'STATUS_CHANGE', ?, CURRENT_TIMESTAMP)
    `, [
      id,
      managerId || req.user.id,
      managerName || req.user.name || 'Team Lead',
      `Official manager evaluation completed. Composite Score: ${mgrCalc.composite_score} (${mgrCalc.tier}). Forwarded to Executive Auditor.`
    ]);

    res.json({
      success: true,
      message: 'Evaluation finalized and sent to Executive Management',
      status: 'Reviewed',
      final_composite_score: mgrCalc.composite_score,
      tier: mgrCalc.tier
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/scorecards/:id/audit-comment - Executive Auditor Action with RBAC
router.post('/scorecards/:id/audit-comment', authenticateToken, async (req, res) => {
  try {
    // RBAC: Executive Auditor only
    if (req.user.role !== 'EXECUTIVE_AUDITOR') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only Executive Management can record audit actions' });
    }

    const { id } = req.params;
    const { authorId, authorName, comment, action } = req.body;

    const scorecard = await db.get(`
      SELECT s.*, u.name as employee_name, u.role as employee_role, u.level as employee_level
      FROM scorecards s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!scorecard) {
      return res.status(404).json({ success: false, message: 'Scorecard not found' });
    }

    const oldStatus = scorecard.status;
    let newStatus = scorecard.status;
    let logAction = action || 'COMMENT';

    if (action === 'APPROVED') {
      newStatus = 'Audited';
      await db.run(`
        UPDATE scorecards
        SET status = 'Audited', audited_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);
      req._transitionLogged = true;
      writeProductionLog(`Scorecard ${id} transitioned from ${oldStatus} to Audited by ${authorName || req.user.name || 'Executive Auditor'}`, req, 200);
    } else if (action === 'REVISION_REQUESTED') {
      newStatus = 'Needs Revision';
      await db.run(`
        UPDATE scorecards
        SET status = 'Needs Revision', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);
      req._transitionLogged = true;
      writeProductionLog(`Scorecard ${id} transitioned from ${oldStatus} to Needs Revision by ${authorName || req.user.name || 'Executive Auditor'}`, req, 200);
    }

    await db.run(`
      INSERT INTO audit_logs (scorecard_id, author_id, author_name, action, comment, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      id,
      authorId || req.user.id,
      authorName || req.user.name || 'Executive Auditor',
      logAction,
      comment
    ]);

    res.json({
      success: true,
      message: action === 'APPROVED' 
        ? 'Scorecard approved and marked as Audited' 
        : (action === 'REVISION_REQUESTED' ? 'Revision requested and status updated to Needs Revision' : 'Audit comment recorded'),
      status: newStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/scorecards/:id/auditor-review - Executive Governance & Audit Review with Per-Item Notes
router.put('/scorecards/:id/auditor-review', authenticateToken, async (req, res) => {
  try {
    // RBAC: Executive Auditor only
    if (req.user.role !== 'EXECUTIVE_AUDITOR') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only Executive Management can perform auditor reviews' });
    }

    const { id } = req.params;
    const { auditor_notes, overall_comment, action, authorId, authorName } = req.body;

    const scorecard = await db.get(`
      SELECT s.*, u.name as employee_name, u.role as employee_role, u.level as employee_level
      FROM scorecards s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (!scorecard) {
      return res.status(404).json({ success: false, message: 'Scorecard not found' });
    }

    // STRICT GUARD: Update per-criterion auditor comments ONLY (never touching manager_score or self_score!)
    if (auditor_notes && Array.isArray(auditor_notes) && auditor_notes.length > 0) {
      const batchStmts = auditor_notes.map(n => ({
        sql: `UPDATE scorecard_items SET auditor_comment = ? WHERE scorecard_id = ? AND kpi_id = ?`,
        args: [n.comment !== undefined ? n.comment : null, id, n.kpi_id]
      }));
      await db.batch(batchStmts);
    }

    const oldStatus = scorecard.status;
    let newStatus = scorecard.status;
    let logAction = action || 'COMMENT';

    if (action === 'APPROVED') {
      newStatus = 'Audited';
      await db.run(`
        UPDATE scorecards
        SET status = 'Audited', audited_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);
      req._transitionLogged = true;
      writeProductionLog(`Scorecard ${id} transitioned from ${oldStatus} to Audited by ${authorName || req.user.name || 'Executive Auditor'}`, req, 200);
    } else if (action === 'REVISION_REQUESTED') {
      newStatus = 'Needs Revision';
      await db.run(`
        UPDATE scorecards
        SET status = 'Needs Revision', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);
      req._transitionLogged = true;
      writeProductionLog(`Scorecard ${id} transitioned from ${oldStatus} to Needs Revision by ${authorName || req.user.name || 'Executive Auditor'}`, req, 200);
    } else {
      req._transitionLogged = true;
      writeProductionLog(`Scorecard ${id} auditor review feedback saved by ${authorName || req.user.name || 'Executive Auditor'}`, req, 200);
    }

    // Insert into audit_logs
    if (overall_comment || action === 'APPROVED' || action === 'REVISION_REQUESTED') {
      const commentText = overall_comment || (
        action === 'APPROVED' 
          ? `Final Executive Sign-Off Approval granted by ${authorName || req.user.name || 'Executive Auditor'}.`
          : `Revisions requested by ${authorName || req.user.name || 'Executive Auditor'}.`
      );

      await db.run(`
        INSERT INTO audit_logs (scorecard_id, author_id, author_name, action, comment, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        id,
        authorId || req.user.id,
        authorName || req.user.name || 'Executive Auditor',
        logAction,
        commentText
      ]);
    }

    res.json({
      success: true,
      message: action === 'APPROVED'
        ? 'Scorecard approved and signed off as Audited'
        : (action === 'REVISION_REQUESTED'
            ? 'Revisions requested and sent back to Team Lead Ahmed Hashim'
            : 'Executive audit feedback saved successfully'),
      status: newStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/leaderboard - Team ranking, metrics, and tiers
router.get('/analytics/leaderboard', authenticateToken, async (req, res) => {
  try {
    const scorecards = await db.all(`
      SELECT 
        s.id, s.user_id, s.period, s.status, s.self_submitted_at, s.reviewed_at, s.audited_at,
        s.self_composite_score, s.final_composite_score, s.tier,
        u.name as employee_name, u.email as employee_email, u.level as employee_level,
        u.title as employee_title, u.avatar as employee_avatar, u.role as employee_role
      FROM scorecards s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.final_composite_score DESC, s.self_composite_score DESC
    `);

    const counts = {
      total: scorecards.length,
      draft: scorecards.filter(s => s.status === 'Draft').length,
      submitted: scorecards.filter(s => s.status === 'Submitted').length,
      reviewed: scorecards.filter(s => s.status === 'Reviewed').length,
      audited: scorecards.filter(s => s.status === 'Audited').length,
    };

    const tiers = {
      topPerformer: scorecards.filter(s => s.tier === 'Top Performer').length,
      solidContributor: scorecards.filter(s => s.tier === 'Solid Contributor').length,
      needsImprovement: scorecards.filter(s => s.tier === 'Needs Improvement').length,
    };

    const finalized = scorecards.filter(s => s.final_composite_score > 0);
    const avgScore = finalized.length > 0
      ? Number((finalized.reduce((sum, s) => sum + s.final_composite_score, 0) / finalized.length).toFixed(2))
      : 0;

    res.json({
      success: true,
      counts,
      tiers,
      teamAverageScore: avgScore,
      leaderboard: scorecards
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/audit-feed - Manager Comments & Audit Feed across all team scorecards
router.get('/audit-feed', authenticateToken, async (req, res) => {
  try {
    const feed = await db.all(`
      SELECT 
        al.id, al.scorecard_id, al.author_id, al.author_name, al.action, al.comment, al.created_at,
        s.user_id, s.status as scorecard_status, s.final_composite_score, s.tier,
        u.name as employee_name, u.email as employee_email, u.level as employee_level, u.avatar as employee_avatar
      FROM audit_logs al
      JOIN scorecards s ON al.scorecard_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY al.id DESC
    `);
    res.json({ success: true, feed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/seed/reset - Reset database to fresh seed state
router.post('/seed/reset', async (req, res) => {
  try {
    await seedDatabase();
    writeProductionLog('All scorecards transitioned to Draft via Database Reset');
    res.json({ success: true, message: 'Database reset and re-seeded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
