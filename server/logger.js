import fs from 'fs';
import path from 'path';

// Production log file: C:\KPIs\production.log
export const LOG_FILE_PATH = path.resolve(process.cwd(), 'production.log');

/**
 * Append a state transition or critical system event to production.log
 */
export function writeProductionLog(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] | ${message}\n`;
  try {
    fs.appendFile(LOG_FILE_PATH, line, 'utf8', (err) => {
      if (err) {
        console.error('[ProductionLogger Error]', err.message);
      }
    });
  } catch (err) {
    console.error('[ProductionLogger Error]', err.message);
  }
}

/**
 * Express middleware to intercept all incoming requests and log them:
 * [TIMESTAMP] | [METHOD] [URL] | User: [email/role] | Status: [StatusCode]
 */
export function productionLoggingMiddleware(req, res, next) {
  res.on('finish', () => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const statusCode = res.statusCode;

    let userStr = 'anonymous/public';
    if (req.user) {
      const email = req.user.email || req.user.name || `id:${req.user.id}`;
      const role = req.user.role || 'USER';
      userStr = `${email}/${role}`;
    } else if (req.body && req.body.email) {
      userStr = `${req.body.email}/unauthenticated`;
    }

    const logLine = `[${timestamp}] | ${method} ${url} | User: ${userStr} | Status: ${statusCode}\n`;

    try {
      fs.appendFile(LOG_FILE_PATH, logLine, 'utf8', (err) => {
        if (err) {
          console.error('[ProductionLoggingMiddleware Error]', err.message);
        }
      });
    } catch (err) {
      console.error('[ProductionLoggingMiddleware Error]', err.message);
    }
  });

  next();
}

export default {
  LOG_FILE_PATH,
  writeProductionLog,
  productionLoggingMiddleware
};
