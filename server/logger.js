import fs from 'fs';
import path from 'path';

// Production log file: strictly /tmp on Vercel / Lambda, process.cwd() locally
const isVercel = Boolean(
  process.env.VERCEL || 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.LAMBDA_TASK_ROOT || 
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);

export const LOG_DIR = isVercel ? '/tmp' : process.cwd();
export const LOG_FILE = path.join(LOG_DIR, 'production.log');
export const LOG_FILE_PATH = LOG_FILE;

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

  // Safe, non-blocking disk append with fail-safe error handling
  try {
    fs.appendFile(LOG_FILE, logLine + '\n', 'utf8', (err) => {
      if (err) {
        // Silently caught / logged via warning without interrupting Express or throwing
        console.warn('[ProductionLogger Warning: Disk write failed]', err.message);
      }
    });
  } catch (err) {
    console.warn('[ProductionLogger Warning: Disk write exception]', err.message);
  }

  return logLine;
}

/**
 * Express middleware to intercept all incoming requests and log them:
 * [TIMESTAMP] | [METHOD] [URL] | User: [email/role] | Status: [StatusCode] | Message: [Custom Message]
 */
export function productionLoggingMiddleware(req, res, next) {
  res.on('finish', () => {
    try {
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
    } catch (middlewareErr) {
      // Completely fail-safe: never bubble error up to Express
      console.warn('[ProductionLoggingMiddleware Warning]', middlewareErr.message);
    }
  });

  next();
}

export default {
  LOG_DIR,
  LOG_FILE,
  LOG_FILE_PATH,
  writeProductionLog,
  productionLoggingMiddleware
};
