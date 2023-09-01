const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, '../../data/greenledger.db'));
    this.init();
  }

  init() {
    // Create tables if they don't exist
    this.createTables();
  }

  createTables() {
    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        address TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        organization TEXT,
        role TEXT DEFAULT 'individual',
        kyc_status TEXT DEFAULT 'not_started',
        total_credits INTEGER DEFAULT 0,
        total_reductions INTEGER DEFAULT 0,
        join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Carbon credits table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS carbon_credits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_id INTEGER UNIQUE,
        issuer TEXT NOT NULL,
        owner TEXT NOT NULL,
        amount REAL NOT NULL,
        project_type TEXT NOT NULL,
        verification_status TEXT DEFAULT 'pending',
        issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiry_date DATETIME,
        metadata_hash TEXT,
        transaction_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (issuer) REFERENCES users(address),
        FOREIGN KEY (owner) REFERENCES users(address)
      )
    `);

    // Projects table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issuer TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        project_type TEXT NOT NULL,
        location TEXT NOT NULL,
        methodology TEXT NOT NULL,
        estimated_reduction REAL NOT NULL,
        actual_reduction REAL DEFAULT 0,
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        verification_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (issuer) REFERENCES users(address)
      )
    `);

    // Project documents table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS project_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        document_hash TEXT NOT NULL,
        document_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);

    // Transactions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT UNIQUE NOT NULL,
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        gas_used INTEGER,
        gas_price INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // KYC records table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS kyc_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_address TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        organization TEXT,
        documents TEXT, -- JSON array of IPFS hashes
        status TEXT DEFAULT 'pending',
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME,
        reviewed_by TEXT,
        FOREIGN KEY (user_address) REFERENCES users(address)
      )
    `);

    // Issuer registrations table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS issuer_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_address TEXT NOT NULL,
        organization_name TEXT NOT NULL,
        description TEXT NOT NULL,
        website TEXT NOT NULL,
        documents TEXT, -- JSON array of IPFS hashes
        status TEXT DEFAULT 'pending',
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME,
        reviewed_by TEXT,
        FOREIGN KEY (user_address) REFERENCES users(address)
      )
    `);

    // Analytics table for caching
    this.db.run(`
      CREATE TABLE IF NOT EXISTS analytics_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cache_key TEXT UNIQUE NOT NULL,
        data TEXT NOT NULL, -- JSON data
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created successfully');
  }

  // User methods
  async getUser(address) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE address = ?',
        [address],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async createUser(userData) {
    return new Promise((resolve, reject) => {
      const { address, name, email, organization, role } = userData;
      this.db.run(
        `INSERT INTO users (address, name, email, organization, role) 
         VALUES (?, ?, ?, ?, ?)`,
        [address, name, email, organization, role],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, address });
        }
      );
    });
  }

  async updateUser(address, updateData) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });
      
      values.push(address);
      
      this.db.run(
        `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE address = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve({ address, changes: this.changes });
        }
      );
    });
  }

  // Carbon credit methods
  async getCarbonCredits(options = {}) {
    const { page = 1, limit = 20, owner, issuer, projectType, status } = options;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM carbon_credits WHERE 1=1';
    const params = [];
    
    if (owner) {
      query += ' AND owner = ?';
      params.push(owner);
    }
    
    if (issuer) {
      query += ' AND issuer = ?';
      params.push(issuer);
    }
    
    if (projectType) {
      query += ' AND project_type = ?';
      params.push(projectType);
    }
    
    if (status) {
      query += ' AND verification_status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else {
          // Get total count
          let countQuery = 'SELECT COUNT(*) as total FROM carbon_credits WHERE 1=1';
          const countParams = [];
          
          if (owner) {
            countQuery += ' AND owner = ?';
            countParams.push(owner);
          }
          
          if (issuer) {
            countQuery += ' AND issuer = ?';
            countParams.push(issuer);
          }
          
          if (projectType) {
            countQuery += ' AND project_type = ?';
            countParams.push(projectType);
          }
          
          if (status) {
            countQuery += ' AND verification_status = ?';
            countParams.push(status);
          }

          this.db.get(countQuery, countParams, (err, countRow) => {
            if (err) reject(err);
            else {
              const total = countRow.total;
              const hasMore = offset + rows.length < total;
              
              resolve({
                data: rows,
                total,
                hasMore
              });
            }
          });
        }
      });
    });
  }

  async getCarbonCreditById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM carbon_credits WHERE id = ? OR token_id = ?',
        [id, id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async getCarbonCreditsByOwner(owner, options = {}) {
    return this.getCarbonCredits({ ...options, owner });
  }

  async getCarbonCreditsByIssuer(issuer, options = {}) {
    return this.getCarbonCredits({ ...options, issuer });
  }

  async createCarbonCredit(creditData) {
    return new Promise((resolve, reject) => {
      const {
        issuer, owner, projectName, description, amount, projectType,
        location, methodology, verificationBody, metadataHash, expiryDate
      } = creditData;

      this.db.run(
        `INSERT INTO carbon_credits 
         (issuer, owner, amount, project_type, metadata_hash, expiry_date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [issuer, owner, amount, projectType, metadataHash, expiryDate],
        function(err) {
          if (err) reject(err);
          else {
            resolve({
              id: this.lastID,
              tokenId: this.lastID,
              issuer,
              owner,
              amount,
              projectType,
              verificationStatus: 'pending',
              issueDate: new Date(),
              expiryDate,
              metadataHash
            });
          }
        }
      );
    });
  }

  async transferCarbonCredit(tokenId, to, amount) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE carbon_credits 
         SET owner = ?, amount = amount - ?, updated_at = CURRENT_TIMESTAMP 
         WHERE token_id = ?`,
        [to, amount, tokenId],
        function(err) {
          if (err) reject(err);
          else resolve({ tokenId, newOwner: to, amount });
        }
      );
    });
  }

  async burnCarbonCredit(tokenId, amount) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE carbon_credits 
         SET amount = amount - ?, updated_at = CURRENT_TIMESTAMP 
         WHERE token_id = ?`,
        [amount, tokenId],
        function(err) {
          if (err) reject(err);
          else resolve({ tokenId, burnedAmount: amount });
        }
      );
    });
  }

  async verifyCarbonCredit(tokenId, verified) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE carbon_credits 
         SET verification_status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE token_id = ?`,
        [verified ? 'verified' : 'rejected', tokenId],
        function(err) {
          if (err) reject(err);
          else resolve({ tokenId, verified });
        }
      );
    });
  }

  // Project methods
  async getProjects(options = {}) {
    const { page = 1, limit = 20, type, location } = options;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];
    
    if (type) {
      query += ' AND project_type = ?';
      params.push(type);
    }
    
    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else {
          // Get total count
          let countQuery = 'SELECT COUNT(*) as total FROM projects WHERE 1=1';
          const countParams = [];
          
          if (type) {
            countQuery += ' AND project_type = ?';
            countParams.push(type);
          }
          
          if (location) {
            countQuery += ' AND location LIKE ?';
            countParams.push(`%${location}%`);
          }

          this.db.get(countQuery, countParams, (err, countRow) => {
            if (err) reject(err);
            else {
              const total = countRow.total;
              const hasMore = offset + rows.length < total;
              
              resolve({
                data: rows,
                total,
                hasMore
              });
            }
          });
        }
      });
    });
  }

  async getProject(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM projects WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async createProject(projectData) {
    return new Promise((resolve, reject) => {
      const {
        issuer, name, description, projectType, location,
        methodology, estimatedReduction, documents
      } = projectData;

      this.db.run(
        `INSERT INTO projects 
         (issuer, name, description, project_type, location, methodology, estimated_reduction) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [issuer, name, description, projectType, location, methodology, estimatedReduction],
        function(err) {
          if (err) reject(err);
          else {
            const projectId = this.lastID;
            
            // Insert documents if provided
            if (documents && documents.length > 0) {
              const docStmt = this.db.prepare(
                'INSERT INTO project_documents (project_id, document_hash) VALUES (?, ?)'
              );
              
              documents.forEach(doc => {
                docStmt.run(projectId, doc);
              });
              
              docStmt.finalize();
            }
            
            resolve({
              id: projectId,
              issuer,
              name,
              description,
              projectType,
              location,
              methodology,
              estimatedReduction,
              isVerified: false,
              isActive: true,
              creationDate: new Date()
            });
          }
        }
      );
    });
  }

  // Dashboard methods
  async getDashboardStats(address) {
    return new Promise((resolve, reject) => {
      const stats = {};
      
      // Get total credits
      this.db.get(
        'SELECT SUM(amount) as total FROM carbon_credits WHERE owner = ?',
        [address],
        (err, creditRow) => {
          if (err) reject(err);
          else {
            stats.totalCredits = creditRow.total || 0;
            
            // Get total reductions
            this.db.get(
              'SELECT SUM(actual_reduction) as total FROM projects WHERE issuer = ? AND is_verified = 1',
              [address],
              (err, reductionRow) => {
                if (err) reject(err);
                else {
                  stats.totalReductions = reductionRow.total || 0;
                  
                  // Get active projects
                  this.db.get(
                    'SELECT COUNT(*) as total FROM projects WHERE issuer = ? AND is_active = 1',
                    [address],
                    (err, projectRow) => {
                      if (err) reject(err);
                      else {
                        stats.activeProjects = projectRow.total || 0;
                        
                        // Get monthly reduction (last 30 days)
                        this.db.get(
                          `SELECT SUM(actual_reduction) as total FROM projects 
                           WHERE issuer = ? AND is_verified = 1 
                           AND creation_date >= datetime('now', '-30 days')`,
                          [address],
                          (err, monthlyRow) => {
                            if (err) reject(err);
                            else {
                              stats.monthlyReduction = monthlyRow.total || 0;
                              stats.carbonFootprint = stats.totalReductions * 0.8; // Estimate
                              stats.creditsHeld = stats.totalCredits;
                              stats.creditsIssued = stats.totalReductions;
                              
                              resolve(stats);
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    });
  }

  async getReductionHistory(address, period = 'month') {
    const periodMap = {
      'week': '-7 days',
      'month': '-30 days',
      'year': '-365 days'
    };
    
    const interval = periodMap[period] || '-30 days';
    
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT DATE(creation_date) as date, SUM(actual_reduction) as amount 
         FROM projects 
         WHERE issuer = ? AND is_verified = 1 AND creation_date >= datetime('now', '${interval}')
         GROUP BY DATE(creation_date)
         ORDER BY date ASC`,
        [address],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getCreditHistory(address, period = 'month') {
    const periodMap = {
      'week': '-7 days',
      'month': '-30 days',
      'year': '-365 days'
    };
    
    const interval = periodMap[period] || '-30 days';
    
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT DATE(issue_date) as date, SUM(amount) as amount 
         FROM carbon_credits 
         WHERE owner = ? AND issue_date >= datetime('now', '${interval}')
         GROUP BY DATE(issue_date)
         ORDER BY date ASC`,
        [address],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Analytics methods
  async getGlobalStats() {
    return new Promise((resolve, reject) => {
      const stats = {};
      
      // Get total credits issued
      this.db.get(
        'SELECT COUNT(*) as total FROM carbon_credits',
        [],
        (err, creditRow) => {
          if (err) reject(err);
          else {
            stats.totalCreditsIssued = creditRow.total || 0;
            
            // Get total projects
            this.db.get(
              'SELECT COUNT(*) as total FROM projects',
              [],
              (err, projectRow) => {
                if (err) reject(err);
                else {
                  stats.totalProjects = projectRow.total || 0;
                  
                  // Get total users
                  this.db.get(
                    'SELECT COUNT(*) as total FROM users',
                    [],
                    (err, userRow) => {
                      if (err) reject(err);
                      else {
                        stats.totalUsers = userRow.total || 0;
                        resolve(stats);
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    });
  }

  async getMarketData() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT project_type, COUNT(*) as count, SUM(amount) as total_amount 
         FROM carbon_credits 
         GROUP BY project_type`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getTrendingProjects() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT p.*, COUNT(cc.id) as credit_count 
         FROM projects p 
         LEFT JOIN carbon_credits cc ON p.id = cc.project_id 
         WHERE p.is_verified = 1 
         GROUP BY p.id 
         ORDER BY credit_count DESC 
         LIMIT 10`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // KYC methods
  async startKYC(address, kycData) {
    return new Promise((resolve, reject) => {
      const { name, email, organization, documents } = kycData;
      
      this.db.run(
        `INSERT INTO kyc_records (user_address, name, email, organization, documents) 
         VALUES (?, ?, ?, ?, ?)`,
        [address, name, email, organization, JSON.stringify(documents)],
        function(err) {
          if (err) reject(err);
          else {
            resolve({
              id: this.lastID,
              address,
              status: 'pending',
              submittedAt: new Date()
            });
          }
        }
      );
    });
  }

  async getKYCStatus(address) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT status FROM kyc_records WHERE user_address = ? ORDER BY submitted_at DESC LIMIT 1',
        [address],
        (err, row) => {
          if (err) reject(err);
          else resolve({ status: row ? row.status : 'not_started' });
        }
      );
    });
  }

  // Issuer registration methods
  async registerIssuer(address, issuerData) {
    return new Promise((resolve, reject) => {
      const { organizationName, description, website, documents } = issuerData;
      
      this.db.run(
        `INSERT INTO issuer_registrations (user_address, organization_name, description, website, documents) 
         VALUES (?, ?, ?, ?, ?)`,
        [address, organizationName, description, website, JSON.stringify(documents)],
        function(err) {
          if (err) reject(err);
          else {
            resolve({
              id: this.lastID,
              address,
              status: 'pending',
              submittedAt: new Date()
            });
          }
        }
      );
    });
  }

  // Close database connection
  close() {
    this.db.close();
  }
}

module.exports = { Database };
