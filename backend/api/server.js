const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ethers } = require('ethers');
const { CarbonCreditFactory, CarbonCredit } = require('../models/contracts');
const { Database } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = new Database();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Carbon Credits API Routes
app.get('/api/carbon-credits', async (req, res) => {
  try {
    const { page = 1, limit = 20, owner, issuer, projectType, status } = req.query;
    
    const credits = await db.getCarbonCredits({
      page: parseInt(page),
      limit: parseInt(limit),
      owner,
      issuer,
      projectType,
      status
    });

    res.json({
      success: true,
      data: credits.data,
      total: credits.total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: credits.hasMore
    });
  } catch (error) {
    console.error('Error fetching carbon credits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch carbon credits'
    });
  }
});

app.get('/api/carbon-credits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const credit = await db.getCarbonCreditById(id);

    if (!credit) {
      return res.status(404).json({
        success: false,
        error: 'Carbon credit not found'
      });
    }

    res.json({
      success: true,
      data: credit
    });
  } catch (error) {
    console.error('Error fetching carbon credit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch carbon credit'
    });
  }
});

app.get('/api/carbon-credits/owner/:owner', async (req, res) => {
  try {
    const { owner } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const credits = await db.getCarbonCreditsByOwner(owner, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: credits.data,
      total: credits.total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: credits.hasMore
    });
  } catch (error) {
    console.error('Error fetching credits by owner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credits by owner'
    });
  }
});

app.get('/api/carbon-credits/issuer/:issuer', async (req, res) => {
  try {
    const { issuer } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const credits = await db.getCarbonCreditsByIssuer(issuer, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: credits.data,
      total: credits.total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: credits.hasMore
    });
  } catch (error) {
    console.error('Error fetching credits by issuer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credits by issuer'
    });
  }
});

app.post('/api/carbon-credits/issue', authenticateToken, validateRequest('issueCredit'), async (req, res) => {
  try {
    const {
      projectName,
      description,
      amount,
      projectType,
      location,
      methodology,
      verificationBody,
      metadataHash,
      expiryDate
    } = req.body;

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than zero'
      });
    }

    // Create carbon credit in database
    const credit = await db.createCarbonCredit({
      issuer: req.user.address,
      projectName,
      description,
      amount,
      projectType,
      location,
      methodology,
      verificationBody,
      metadataHash,
      expiryDate: expiryDate ? new Date(expiryDate) : null
    });

    res.status(201).json({
      success: true,
      data: credit,
      message: 'Carbon credit issued successfully'
    });
  } catch (error) {
    console.error('Error issuing carbon credit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to issue carbon credit'
    });
  }
});

app.post('/api/carbon-credits/transfer', authenticateToken, validateRequest('transferCredit'), async (req, res) => {
  try {
    const { tokenId, to, amount } = req.body;

    // Validate transfer
    const credit = await db.getCarbonCreditById(tokenId);
    if (!credit) {
      return res.status(404).json({
        success: false,
        error: 'Carbon credit not found'
      });
    }

    if (credit.owner !== req.user.address) {
      return res.status(403).json({
        success: false,
        error: 'Only owner can transfer credit'
      });
    }

    if (!credit.verified) {
      return res.status(400).json({
        success: false,
        error: 'Credit must be verified before transfer'
      });
    }

    // Update credit ownership
    const updatedCredit = await db.transferCarbonCredit(tokenId, to, amount);

    res.json({
      success: true,
      data: updatedCredit,
      message: 'Carbon credit transferred successfully'
    });
  } catch (error) {
    console.error('Error transferring carbon credit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transfer carbon credit'
    });
  }
});

app.post('/api/carbon-credits/burn', authenticateToken, validateRequest('burnCredit'), async (req, res) => {
  try {
    const { tokenId, amount } = req.body;

    // Validate burn
    const credit = await db.getCarbonCreditById(tokenId);
    if (!credit) {
      return res.status(404).json({
        success: false,
        error: 'Carbon credit not found'
      });
    }

    if (credit.owner !== req.user.address) {
      return res.status(403).json({
        success: false,
        error: 'Only owner can burn credit'
      });
    }

    // Burn credit
    const burnedCredit = await db.burnCarbonCredit(tokenId, amount);

    res.json({
      success: true,
      data: burnedCredit,
      message: 'Carbon credit burned successfully'
    });
  } catch (error) {
    console.error('Error burning carbon credit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to burn carbon credit'
    });
  }
});

app.post('/api/carbon-credits/verify', authenticateToken, validateRequest('verifyCredit'), async (req, res) => {
  try {
    const { tokenId, verified } = req.body;

    // Validate verification
    const credit = await db.getCarbonCreditById(tokenId);
    if (!credit) {
      return res.status(404).json({
        success: false,
        error: 'Carbon credit not found'
      });
    }

    if (credit.issuer !== req.user.address) {
      return res.status(403).json({
        success: false,
        error: 'Only issuer can verify credit'
      });
    }

    // Update verification status
    const updatedCredit = await db.verifyCarbonCredit(tokenId, verified);

    res.json({
      success: true,
      data: updatedCredit,
      message: `Carbon credit ${verified ? 'verified' : 'unverified'} successfully`
    });
  } catch (error) {
    console.error('Error verifying carbon credit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify carbon credit'
    });
  }
});

// Users API Routes
app.get('/api/users/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const user = await db.getUser(address);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

app.put('/api/users/:address', authenticateToken, validateRequest('updateUser'), async (req, res) => {
  try {
    const { address } = req.params;
    
    if (address !== req.user.address) {
      return res.status(403).json({
        success: false,
        error: 'Can only update own profile'
      });
    }

    const updatedUser = await db.updateUser(address, req.body);

    res.json({
      success: true,
      data: updatedUser,
      message: 'User profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

app.post('/api/users/:address/kyc', authenticateToken, validateRequest('startKYC'), async (req, res) => {
  try {
    const { address } = req.params;
    
    if (address !== req.user.address) {
      return res.status(403).json({
        success: false,
        error: 'Can only start KYC for own address'
      });
    }

    const kycResult = await db.startKYC(address, req.body);

    res.status(201).json({
      success: true,
      data: kycResult,
      message: 'KYC process started successfully'
    });
  } catch (error) {
    console.error('Error starting KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start KYC process'
    });
  }
});

app.get('/api/users/:address/kyc', async (req, res) => {
  try {
    const { address } = req.params;
    const kycStatus = await db.getKYCStatus(address);

    res.json({
      success: true,
      data: kycStatus
    });
  } catch (error) {
    console.error('Error fetching KYC status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch KYC status'
    });
  }
});

app.post('/api/users/:address/issuer', authenticateToken, validateRequest('registerIssuer'), async (req, res) => {
  try {
    const { address } = req.params;
    
    if (address !== req.user.address) {
      return res.status(403).json({
        success: false,
        error: 'Can only register as issuer for own address'
      });
    }

    const issuerResult = await db.registerIssuer(address, req.body);

    res.status(201).json({
      success: true,
      data: issuerResult,
      message: 'Issuer registration submitted successfully'
    });
  } catch (error) {
    console.error('Error registering issuer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register as issuer'
    });
  }
});

// Dashboard API Routes
app.get('/api/dashboard/stats/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const stats = await db.getDashboardStats(address);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
});

app.get('/api/dashboard/reductions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { period = 'month' } = req.query;

    const reductions = await db.getReductionHistory(address, period);

    res.json({
      success: true,
      data: reductions
    });
  } catch (error) {
    console.error('Error fetching reduction history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reduction history'
    });
  }
});

app.get('/api/dashboard/credits/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { period = 'month' } = req.query;

    const credits = await db.getCreditHistory(address, period);

    res.json({
      success: true,
      data: credits
    });
  } catch (error) {
    console.error('Error fetching credit history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credit history'
    });
  }
});

// Projects API Routes
app.get('/api/projects', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, location } = req.query;

    const projects = await db.getProjects({
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      location
    });

    res.json({
      success: true,
      data: projects.data,
      total: projects.total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: projects.hasMore
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await db.getProject(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
});

app.post('/api/projects', authenticateToken, validateRequest('createProject'), async (req, res) => {
  try {
    const project = await db.createProject({
      ...req.body,
      issuer: req.user.address
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

// Analytics API Routes
app.get('/api/analytics/global', async (req, res) => {
  try {
    const stats = await db.getGlobalStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching global analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch global analytics'
    });
  }
});

app.get('/api/analytics/market', async (req, res) => {
  try {
    const marketData = await db.getMarketData();

    res.json({
      success: true,
      data: marketData
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market data'
    });
  }
});

app.get('/api/analytics/trending', async (req, res) => {
  try {
    const trendingProjects = await db.getTrendingProjects();

    res.json({
      success: true,
      data: trendingProjects
    });
  } catch (error) {
    console.error('Error fetching trending projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending projects'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GreenLedger API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
