# GreenLedger Deployment Guide

This guide covers deploying GreenLedger to various environments and platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Database Setup](#database-setup)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: 18+ (LTS recommended)
- **npm**: 8+ or **yarn**: 1.22+
- **Git**: Latest version
- **Database**: SQLite (development) or PostgreSQL (production)
- **Blockchain**: Access to Ethereum mainnet/testnet RPC endpoints

### Required Accounts

- **Infura/Alchemy**: For blockchain RPC access
- **IPFS Provider**: Pinata, Infura IPFS, or self-hosted
- **Domain**: For production deployment
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/Edwiin-Hoover/GreenLedger.git
cd GreenLedger
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install smart contract dependencies
cd contracts
npm install
cd ..
```

### 3. Environment Configuration

```bash
# Copy environment template
cp env.example .env.local

# Edit configuration
nano .env.local
```

### Required Environment Variables

```bash
# Node Environment
NODE_ENV=production

# Frontend Configuration
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_FACTORY_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Backend Configuration
PORT=3001
FRONTEND_URL=https://your-domain.com
JWT_SECRET=your_secure_jwt_secret_key_here
API_KEY=your_api_key_here

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/greenledger

# IPFS Configuration
NEXT_PUBLIC_IPFS_API_URL=https://ipfs.infura.io:5001
NEXT_PUBLIC_IPFS_AUTH=your_ipfs_auth_token

# Blockchain RPC URLs
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
ARBITRUM_RPC_URL=https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
OPTIMISM_RPC_URL=https://optimism-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Private Key for Contract Interactions (Keep Secure!)
PRIVATE_KEY=your_private_key_here

# API Keys for Block Explorers
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimistic_etherscan_api_key
```

## Local Development

### 1. Start Development Server

```bash
# Start frontend development server
npm run dev

# In another terminal, start backend API server
npm run dev:api
```

### 2. Access Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

### 3. Run Tests

```bash
# Frontend tests
npm test

# Smart contract tests
cd contracts && npm test

# All tests
npm run test:all
```

## Production Deployment

### Option 1: Vercel (Recommended for Frontend)

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Configure build settings

2. **Environment Variables**:
   - Add all required environment variables in Vercel dashboard
   - Ensure `NODE_ENV=production`

3. **Deploy**:
   - Vercel will automatically deploy on every push to main branch
   - Custom domain can be configured in project settings

### Option 2: Docker Deployment

1. **Create Dockerfile**:

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

2. **Build and Run**:

```bash
# Build Docker image
docker build -t greenledger .

# Run container
docker run -p 3000:3000 --env-file .env.local greenledger
```

### Option 3: Traditional Server Deployment

1. **Server Setup** (Ubuntu/Debian):

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install SSL certificate
sudo apt install certbot python3-certbot-nginx -y
```

2. **Deploy Application**:

```bash
# Clone repository
git clone https://github.com/Edwiin-Hoover/GreenLedger.git
cd GreenLedger

# Install dependencies
npm install

# Build application
npm run build

# Start with PM2
pm2 start npm --name "greenledger" -- start
pm2 startup
pm2 save
```

3. **Configure Nginx**:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Enable SSL**:

```bash
sudo certbot --nginx -d your-domain.com
```

## Smart Contract Deployment

### 1. Prepare Deployment

```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npm run compile
```

### 2. Deploy to Testnet

```bash
# Deploy to Goerli testnet
npm run deploy:goerli

# Verify contracts
npm run verify:goerli
```

### 3. Deploy to Mainnet

```bash
# Deploy to mainnet
npm run deploy:mainnet

# Verify contracts
npm run verify:mainnet
```

### 4. Update Environment Variables

After deployment, update your environment variables with the deployed contract addresses:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
NEXT_PUBLIC_FACTORY_ADDRESS=0x0987654321098765432109876543210987654321
```

## Database Setup

### Development (SQLite)

SQLite is used by default for development. No additional setup required.

### Production (PostgreSQL)

1. **Install PostgreSQL**:

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib -y

# macOS
brew install postgresql
```

2. **Create Database**:

```sql
-- Connect to PostgreSQL
sudo -u postgres psql

-- Create database and user
CREATE DATABASE greenledger;
CREATE USER greenledger_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE greenledger TO greenledger_user;
```

3. **Update Environment Variables**:

```bash
DATABASE_URL=postgresql://greenledger_user:secure_password@localhost:5432/greenledger
```

4. **Run Migrations**:

```bash
npm run migrate
```

## Monitoring and Logging

### 1. Application Monitoring

```bash
# Install monitoring tools
npm install --save @sentry/nextjs

# Configure Sentry
# Add to next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // Your existing Next.js config
}, {
  // Sentry config
  org: 'your-org',
  project: 'greenledger',
  silent: true,
});
```

### 2. Log Management

```bash
# Install log management
npm install --save winston

# Configure logging
# Add to backend/api/server.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### 3. Health Checks

The API includes health check endpoints:

```bash
# Check API health
curl https://your-domain.com/api/health

# Check database connection
curl https://your-domain.com/api/health/db
```

## Security Considerations

### 1. Environment Security

- **Never commit** `.env` files to version control
- **Use strong secrets** for JWT_SECRET and API keys
- **Rotate keys** regularly
- **Use environment-specific** configurations

### 2. Database Security

- **Use strong passwords** for database users
- **Enable SSL** for database connections
- **Regular backups** of database
- **Access control** and firewall rules

### 3. API Security

- **Rate limiting** to prevent abuse
- **Input validation** on all endpoints
- **CORS configuration** for cross-origin requests
- **Helmet.js** for security headers

### 4. Smart Contract Security

- **Audit contracts** before mainnet deployment
- **Use OpenZeppelin** libraries when possible
- **Test thoroughly** with different scenarios
- **Monitor contract** for unusual activity

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Database Connection Issues**:
   ```bash
   # Check database status
   sudo systemctl status postgresql
   
   # Check connection string
   echo $DATABASE_URL
   ```

3. **Smart Contract Deployment Issues**:
   ```bash
   # Check network configuration
   npx hardhat console --network mainnet
   
   # Verify gas prices
   npx hardhat gas-report
   ```

4. **IPFS Connection Issues**:
   ```bash
   # Test IPFS connection
   curl -X POST https://ipfs.infura.io:5001/api/v0/version
   ```

### Logs and Debugging

```bash
# View application logs
pm2 logs greenledger

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# View database logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

### Performance Optimization

1. **Frontend Optimization**:
   - Enable Next.js image optimization
   - Use CDN for static assets
   - Implement caching strategies

2. **Backend Optimization**:
   - Use Redis for caching
   - Implement database indexing
   - Optimize API queries

3. **Database Optimization**:
   - Regular VACUUM and ANALYZE
   - Proper indexing strategy
   - Connection pooling

### Backup Strategy

```bash
# Database backup
pg_dump greenledger > backup_$(date +%Y%m%d_%H%M%S).sql

# Application backup
tar -czf greenledger_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/greenledger

# Automated backups with cron
0 2 * * * /path/to/backup_script.sh
```

---

For additional help, please refer to the [Contributing Guide](CONTRIBUTING.md) or open an issue on GitHub.
