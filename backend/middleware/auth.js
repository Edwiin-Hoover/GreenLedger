const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');

const JWT_SECRET = process.env.JWT_SECRET || 'greenledger-secret-key';

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Generate JWT token for user
 */
const generateToken = (userData) => {
  const payload = {
    address: userData.address,
    role: userData.role || 'individual',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return jwt.sign(payload, JWT_SECRET);
};

/**
 * Verify wallet signature for authentication
 */
const verifyWalletSignature = async (address, message, signature) => {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying wallet signature:', error);
    return false;
  }
};

/**
 * Generate authentication message for wallet signing
 */
const generateAuthMessage = (address, nonce) => {
  return `Welcome to GreenLedger!

Please sign this message to authenticate with your wallet.

Address: ${address}
Nonce: ${nonce}
Timestamp: ${new Date().toISOString()}

This request will not trigger a blockchain transaction or cost any gas fees.`;
};

/**
 * Middleware to check if user has specific role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is verified issuer
 */
const requireVerifiedIssuer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // This would typically check against the database
  // For now, we'll assume all authenticated users can be issuers
  if (req.user.role !== 'issuer' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Verified issuer role required'
    });
  }

  next();
};

/**
 * Middleware to check if user has completed KYC
 */
const requireKYC = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // This would typically check KYC status from database
  // For now, we'll assume all authenticated users have completed KYC
  next();
};

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  // In a real implementation, you would use Redis or similar
  // For now, we'll use a simple in-memory store
  if (!global.authAttempts) {
    global.authAttempts = new Map();
  }

  const attempts = global.authAttempts.get(clientIp) || [];
  const recentAttempts = attempts.filter(time => now - time < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again later.'
    });
  }

  recentAttempts.push(now);
  global.authAttempts.set(clientIp, recentAttempts);

  next();
};

/**
 * Middleware to validate Ethereum address
 */
const validateAddress = (req, res, next) => {
  const { address } = req.params;

  if (!address || !ethers.utils.isAddress(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Ethereum address'
    });
  }

  req.params.address = address.toLowerCase();
  next();
};

/**
 * Middleware to sanitize user input
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Middleware to log authentication events
 */
const logAuthEvent = (eventType) => {
  return (req, res, next) => {
    const logData = {
      event: eventType,
      address: req.user?.address || req.body?.address,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    console.log('Auth Event:', JSON.stringify(logData));
    next();
  };
};

/**
 * Middleware to check API key for external integrations
 */
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    });
  }

  // In a real implementation, you would validate against a database
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  generateToken,
  verifyWalletSignature,
  generateAuthMessage,
  requireRole,
  requireVerifiedIssuer,
  requireKYC,
  authRateLimit,
  validateAddress,
  sanitizeInput,
  logAuthEvent,
  requireApiKey
};
