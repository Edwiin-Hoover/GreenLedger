const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Choose the aspect of your log customizing the log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports the logger must use to print out messages
const transports = [
  // Allow the use the console to print the messages
  new winston.transports.Console(),
  // Allow to print all the error level messages inside the error.log file
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
  }),
  // Allow to print all the error message inside the all.log file
  new winston.transports.File({ 
    filename: path.join(__dirname, '../logs/combined.log') 
  }),
];

// Create the logger instance that has to be exported and used to log messages
const Logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels,
  format,
  transports,
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Morgan middleware setup for HTTP request logging
const morgan = require('morgan');

// Custom token for response time
morgan.token('response-time-ms', (req, res) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '-';
});

// Custom token for user address
morgan.token('user', (req) => {
  return req.user ? req.user.address : 'anonymous';
});

// Custom format for HTTP logs
const morganFormat = ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms';

// Create morgan middleware
const morganMiddleware = morgan(morganFormat, {
  stream: {
    write: (message) => Logger.http(message.trim()),
  },
});

// Utility functions for structured logging
const logWithMetadata = (level, message, metadata = {}) => {
  Logger[level]({
    message,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

// Specific logging functions
const logError = (error, context = {}) => {
  Logger.error({
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...context,
    timestamp: new Date().toISOString(),
  });
};

const logTransaction = (txHash, action, metadata = {}) => {
  Logger.info({
    message: `Transaction ${action}`,
    txHash,
    action,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

const logApiCall = (method, endpoint, duration, status, metadata = {}) => {
  Logger.info({
    message: `API ${method} ${endpoint}`,
    method,
    endpoint,
    duration,
    status,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

const logAuth = (address, action, success = true, metadata = {}) => {
  Logger.info({
    message: `Auth ${action} ${success ? 'successful' : 'failed'}`,
    address,
    action,
    success,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

const logDatabase = (operation, table, success = true, metadata = {}) => {
  Logger.info({
    message: `Database ${operation} on ${table} ${success ? 'successful' : 'failed'}`,
    operation,
    table,
    success,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

const logIPFS = (action, hash, success = true, metadata = {}) => {
  Logger.info({
    message: `IPFS ${action} ${success ? 'successful' : 'failed'}`,
    action,
    hash,
    success,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

const logSecurity = (event, severity = 'medium', metadata = {}) => {
  const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
  Logger[level]({
    message: `Security event: ${event}`,
    event,
    severity,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};

// Performance monitoring
const performanceLogger = (operation) => {
  const start = Date.now();
  return {
    end: (metadata = {}) => {
      const duration = Date.now() - start;
      Logger.info({
        message: `Performance: ${operation} completed in ${duration}ms`,
        operation,
        duration,
        ...metadata,
        timestamp: new Date().toISOString(),
      });
      return duration;
    },
  };
};

// Request ID middleware for tracing
const requestIdMiddleware = (req, res, next) => {
  req.requestId = require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Response time middleware
const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', duration);
  });
  next();
};

module.exports = {
  Logger,
  morganMiddleware,
  requestIdMiddleware,
  responseTimeMiddleware,
  
  // Utility functions
  logWithMetadata,
  logError,
  logTransaction,
  logApiCall,
  logAuth,
  logDatabase,
  logIPFS,
  logSecurity,
  performanceLogger,
  
  // Direct access to log levels
  info: (message, metadata) => logWithMetadata('info', message, metadata),
  warn: (message, metadata) => logWithMetadata('warn', message, metadata),
  error: (message, metadata) => logWithMetadata('error', message, metadata),
  debug: (message, metadata) => logWithMetadata('debug', message, metadata),
  http: (message, metadata) => logWithMetadata('http', message, metadata),
};
