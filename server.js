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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
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

// Initialize SQLite database (WAL on local/on-prem, /tmp on Vercel)
initDatabase();

// Auto-seed if database has no users (e.g. fresh Vercel /tmp or newly created db)
try {
  const userRow = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!userRow || userRow.count === 0) {
    console.log('[Server] Database is empty. Running auto-seed for all accounts and taxonomies...');
    seedDatabase();
  }
} catch (err) {
  console.warn('[Server] Auto-seed check error:', err.message);
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
