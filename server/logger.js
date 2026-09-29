import fs from 'fs';
import path from 'path';

// Production log file: /tmp/production.log on Vercel, ./production.log locally
const isVercel = Boolean(process.env.VERCEL);
export const LOG_FILE_PATH = isVercel 
  ? '/tmp/production.log' 
  : path.resolve(process.cwd(), 'production.log');

/**
 * Output a formatted log entry to console.log (for Vercel dashboard) AND append to file.
 * Format: [TIMESTAMP] | [METHOD] [URL] | User: [email/role] | Status: [StatusCode] | Message: [Custom Message]
 */
export function writeProductionLog(arg, req = null, statusCode = 200) {
  let method = 'SYS';
  let url = '-';
  let user = 'system/internal';
  let code = statusCode;
  let message = '';

  if (typeof arg === 'string') {
    message = arg;
    if (req) {
      method = req.method || 'SYS';
      url = req.originalUrl || req.url || '-';
      if (req.user) {
        const identifier = req.user.email || req.user.name || `id:${req.user.id}`;
        const role = req.user.role || 'USER';
        user = `${identifier}/${role}`;
      } else if (req.body?.email) {
        user = `${req.body.email}/unauthenticated`;
      }
    }
  } else if (arg && typeof arg === 'object') {
    method = arg.method || 'SYS';
    url = arg.url || '-';
    user = arg.user || 'system/internal';
    code = arg.statusCode !== undefined ? arg.statusCode : 200;
    message = arg.message || '';
  }

  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] | ${method} ${url} | User: ${user} | Status: ${code} | Message: ${message}`;

  // Log to stdout for Vercel runtime log collector
  console.log(logLine);

  // Append to file
  try {
    fs.appendFile(LOG_FILE_PATH, logLine + '\n', 'utf8', (err) => {
      if (err) {
        console.error('[ProductionLogger Error]', err.message);
      }
    });
  } catch (err) {
    console.error('[ProductionLogger Error]', err.message);
  }

  return logLine;
}

/**
 * Express middleware to intercept all incoming requests and log them:
 * [TIMESTAMP] | [METHOD] [URL] | User: [email/role] | Status: [StatusCode] | Message: [Custom Message]
 */
export function productionLoggingMiddleware(req, res, next) {
  res.on('finish', () => {
    // If request already logged a custom state transition, avoid duplicate entry
    if (req._transitionLogged) return;

    const method = req.method;
    const url = req.originalUrl || req.url;
    const statusCode = res.statusCode;

    let userStr = 'anonymous/public';
    if (req.user) {
      const identifier = req.user.email || req.user.name || `id:${req.user.id}`;
      const role = req.user.role || 'USER';
      userStr = `${identifier}/${role}`;
    } else if (req.body && req.body.email) {
      userStr = `${req.body.email}/unauthenticated`;
    }

    const message = req._customLogMessage || res.statusMessage || (statusCode >= 400 ? 'Request Error' : 'Request OK');

    writeProductionLog({
      method,
      url,
      user: userStr,
      statusCode,
      message
    });
  });

  next();
}

export default {
  LOG_FILE_PATH,
  writeProductionLog,
  productionLoggingMiddleware
};
