const Joi = require('joi');

// Validation schemas
const schemas = {
  issueCredit: Joi.object({
    projectName: Joi.string().min(1).max(100).required(),
    description: Joi.string().min(1).max(1000).required(),
    amount: Joi.number().positive().max(1000000).required(),
    projectType: Joi.string().valid(
      'renewable_energy',
      'energy_efficiency',
      'forest_conservation',
      'reforestation',
      'carbon_capture',
      'waste_management',
      'transportation',
      'other'
    ).required(),
    location: Joi.string().min(1).max(200).required(),
    methodology: Joi.string().min(1).max(200).required(),
    verificationBody: Joi.string().min(1).max(200).required(),
    metadataHash: Joi.string().pattern(/^Qm[a-zA-Z0-9]{44}$/).required(),
    expiryDate: Joi.date().greater('now').optional()
  }),

  transferCredit: Joi.object({
    tokenId: Joi.number().integer().positive().required(),
    to: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
    amount: Joi.number().positive().required()
  }),

  burnCredit: Joi.object({
    tokenId: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().required()
  }),

  verifyCredit: Joi.object({
    tokenId: Joi.number().integer().positive().required(),
    verified: Joi.boolean().required()
  }),

  updateUser: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    email: Joi.string().email().optional(),
    organization: Joi.string().min(1).max(200).optional()
  }),

  startKYC: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().required(),
    organization: Joi.string().min(1).max(200).optional(),
    documents: Joi.array().items(Joi.string().pattern(/^Qm[a-zA-Z0-9]{44}$/)).min(1).required()
  }),

  registerIssuer: Joi.object({
    organizationName: Joi.string().min(1).max(200).required(),
    description: Joi.string().min(1).max(1000).required(),
    website: Joi.string().uri().required(),
    documents: Joi.array().items(Joi.string().pattern(/^Qm[a-zA-Z0-9]{44}$/)).min(1).required()
  }),

  createProject: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().min(1).max(2000).required(),
    projectType: Joi.string().valid(
      'renewable_energy',
      'energy_efficiency',
      'forest_conservation',
      'reforestation',
      'carbon_capture',
      'waste_management',
      'transportation',
      'other'
    ).required(),
    location: Joi.string().min(1).max(200).required(),
    methodology: Joi.string().min(1).max(200).required(),
    estimatedReduction: Joi.number().positive().max(1000000).required(),
    documents: Joi.array().items(Joi.string().pattern(/^Qm[a-zA-Z0-9]{44}$/)).min(1).required()
  }),

  walletAuth: Joi.object({
    address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
    message: Joi.string().min(1).required(),
    signature: Joi.string().pattern(/^0x[a-fA-F0-9]{130}$/).required()
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  period: Joi.object({
    period: Joi.string().valid('week', 'month', 'year').default('month')
  })
};

/**
 * Generic validation middleware factory
 */
const validateRequest = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        error: 'Invalid validation schema'
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorDetails
      });
    }

    req.body = value;
    next();
  };
};

/**
 * Validate query parameters
 */
const validateQuery = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        error: 'Invalid validation schema'
      });
    }

    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      });

      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: errorDetails
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Validate Ethereum address format
 */
const validateAddress = (req, res, next) => {
  const { address } = req.params;
  
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Ethereum address format'
    });
  }

  req.params.address = address.toLowerCase();
  next();
};

/**
 * Validate IPFS hash format
 */
const validateIPFSHash = (req, res, next) => {
  const { hash } = req.params;
  
  if (!hash || !/^Qm[a-zA-Z0-9]{44}$/.test(hash)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid IPFS hash format'
    });
  }

  next();
};

/**
 * Validate numeric ID
 */
const validateNumericId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid numeric ID'
    });
  }

  req.params.id = parseInt(id);
  next();
};

/**
 * Validate file upload
 */
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'File upload required'
      });
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB'
      });
    }

    next();
  };
};

/**
 * Validate carbon credit amount
 */
const validateCreditAmount = (req, res, next) => {
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Amount must be greater than zero'
    });
  }

  if (amount > 1000000) {
    return res.status(400).json({
      success: false,
      error: 'Amount too large. Maximum is 1,000,000 tons CO2'
    });
  }

  next();
};

/**
 * Validate project type
 */
const validateProjectType = (req, res, next) => {
  const validTypes = [
    'renewable_energy',
    'energy_efficiency',
    'forest_conservation',
    'reforestation',
    'carbon_capture',
    'waste_management',
    'transportation',
    'other'
  ];

  const { projectType } = req.body;
  
  if (!projectType || !validTypes.includes(projectType)) {
    return res.status(400).json({
      success: false,
      error: `Invalid project type. Valid types: ${validTypes.join(', ')}`
    });
  }

  next();
};

/**
 * Validate verification status
 */
const validateVerificationStatus = (req, res, next) => {
  const validStatuses = ['pending', 'verified', 'rejected', 'expired'];
  const { status } = req.query;
  
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid verification status. Valid statuses: ${validStatuses.join(', ')}`
    });
  }

  next();
};

/**
 * Validate date range
 */
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD format'
      });
    }
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be before end date'
      });
    }
  }

  next();
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Sanitize object recursively
 */
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

/**
 * Sanitize request body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Sanitize query parameters
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

module.exports = {
  validateRequest,
  validateQuery,
  validateAddress,
  validateIPFSHash,
  validateNumericId,
  validateFileUpload,
  validateCreditAmount,
  validateProjectType,
  validateVerificationStatus,
  validateDateRange,
  sanitizeBody,
  sanitizeQuery,
  schemas
};
