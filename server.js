import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './server/api.js';
import { initDatabase, db } from './server/db.js';
import { seedDatabase } from './server/seed.js';
import { productionLoggingMiddleware, writeProductionLog } from './server/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Security Middleware: Helmet with customized CSP for Google Fonts and Vite assets
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json());
app.use(productionLoggingMiddleware);

// Record initial server startup entry
writeProductionLog('Production server logging initialized');

// Initialize SQLite database (WAL on local/on-prem, /tmp on Vercel)
initDatabase();

// Ensure official accounts and taxonomies are fully populated
try {
  const lead = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get('a.hashim@ebetech.com.eg');
  if (!lead) {
    console.log('[Server] Official accounts missing or outdated. Running database seed...');
    seedDatabase();
  }
} catch (err) {
  console.warn('[Server] Seed check error:', err.message);
  try {
    seedDatabase();
  } catch (e) {
    console.error('[Server] Emergency seed failed:', e.message);
  }
}

// Mount REST API endpoints
app.use('/api', apiRouter);

// Serve frontend
const distPath = path.resolve(__dirname, 'dist');
const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));

if (hasDist && process.env.DEV_MODE !== 'true') {
  console.log('[Server] Serving pre-built production assets from:', distPath);
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  console.log('[Server] Initializing Vite middleware mode...');
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: __dirname,
  });
  app.use(vite.middlewares);
}

// Global Sanitized Error Handler (prevents stack trace leakage)
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

if (!process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(` Fintech BA KPI Evaluation System is LIVE!`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`====================================================`);
  });
}

export default app;
