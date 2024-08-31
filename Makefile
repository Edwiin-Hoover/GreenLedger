# GreenLedger Makefile
# Provides convenient commands for development and deployment

.PHONY: help install dev build test clean deploy docker monitor

# Default target
help: ## Show this help message
	@echo "GreenLedger Development Commands"
	@echo "================================"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation and setup
install: ## Install all dependencies
	@echo "Installing dependencies..."
	npm install
	cd contracts && npm install
	cd backend && npm install

setup: ## Initial project setup
	@echo "Setting up project..."
	chmod +x scripts/*.sh
	./scripts/setup.sh

# Development
dev: ## Start development server
	@echo "Starting development server..."
	npm run dev

dev-backend: ## Start backend development server
	@echo "Starting backend development server..."
	npm run backend:dev

dev-all: ## Start all development servers
	@echo "Starting all development servers..."
	make -j2 dev dev-backend

# Building
build: ## Build the application
	@echo "Building application..."
	npm run build

build-contracts: ## Compile smart contracts
	@echo "Compiling smart contracts..."
	npm run compile

build-docker: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t greenledger .

# Testing
test: ## Run all tests
	@echo "Running tests..."
	npm run test:all

test-frontend: ## Run frontend tests
	@echo "Running frontend tests..."
	npm test

test-contracts: ## Run smart contract tests
	@echo "Running smart contract tests..."
	cd contracts && npm test

test-backend: ## Run backend tests
	@echo "Running backend tests..."
	npm run backend:test

test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	npm run test:ci

# Code quality
lint: ## Run linter
	@echo "Running linter..."
	npm run lint

lint-fix: ## Fix linting issues
	@echo "Fixing linting issues..."
	npm run lint:fix

format: ## Format code
	@echo "Formatting code..."
	npm run format

format-check: ## Check code formatting
	@echo "Checking code formatting..."
	npm run format:check

type-check: ## Check TypeScript types
	@echo "Checking TypeScript types..."
	npm run type-check

# Deployment
deploy-local: ## Deploy to local network
	@echo "Deploying to local network..."
	npm run deploy:local

deploy-testnet: ## Deploy to testnet
	@echo "Deploying to testnet..."
	npm run deploy:testnet

deploy-mainnet: ## Deploy to mainnet (use with caution)
	@echo "Deploying to mainnet..."
	@read -p "Are you sure you want to deploy to mainnet? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		npm run deploy:mainnet; \
	else \
		echo "Deployment cancelled."; \
	fi

# Docker operations
docker-build: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t greenledger .

docker-run: ## Run Docker container
	@echo "Running Docker container..."
	docker run -p 3000:3000 greenledger

docker-compose-up: ## Start services with docker-compose
	@echo "Starting services with docker-compose..."
	docker-compose up -d

docker-compose-down: ## Stop services with docker-compose
	@echo "Stopping services with docker-compose..."
	docker-compose down

docker-logs: ## Show Docker logs
	@echo "Showing Docker logs..."
	docker-compose logs -f

# Database operations
db-migrate: ## Run database migrations
	@echo "Running database migrations..."
	npm run db:migrate

db-seed: ## Seed database with test data
	@echo "Seeding database..."
	npm run db:seed

db-reset: ## Reset database
	@echo "Resetting database..."
	npm run db:migrate && npm run db:seed

# Cache and queue operations
cache-clear: ## Clear Redis cache
	@echo "Clearing Redis cache..."
	npm run cache:clear

queue-dashboard: ## Open queue dashboard
	@echo "Opening queue dashboard..."
	npm run queue:dashboard

# Monitoring and maintenance
monitor: ## Run system monitoring
	@echo "Running system monitoring..."
	npm run monitor

monitor-report: ## Generate monitoring report
	@echo "Generating monitoring report..."
	npm run monitor:report

logs: ## Show application logs
	@echo "Showing application logs..."
	tail -f backend/logs/combined.log

health-check: ## Check application health
	@echo "Checking application health..."
	curl -f http://localhost:3000/api/health || echo "Frontend not responding"
	curl -f http://localhost:5000/health || echo "Backend not responding"

# Cleanup
clean: ## Clean build artifacts and caches
	@echo "Cleaning build artifacts..."
	npm run clean
	rm -rf backend/logs/*.log
	docker system prune -f

clean-all: ## Deep clean including node_modules
	@echo "Deep cleaning project..."
	make clean
	rm -rf node_modules
	rm -rf backend/node_modules
	rm -rf contracts/node_modules

# Security
audit: ## Run security audit
	@echo "Running security audit..."
	npm audit
	cd backend && npm audit
	cd contracts && npm audit

audit-fix: ## Fix security vulnerabilities
	@echo "Fixing security vulnerabilities..."
	npm audit fix
	cd backend && npm audit fix
	cd contracts && npm audit fix

# Git operations
git-status: ## Show git status for all modules
	@echo "Git status:"
	git status --porcelain
	@echo "Backend git status:"
	cd backend && git status --porcelain 2>/dev/null || echo "Not a git repository"
	@echo "Contracts git status:"
	cd contracts && git status --porcelain 2>/dev/null || echo "Not a git repository"

git-pull: ## Pull latest changes
	@echo "Pulling latest changes..."
	git pull origin main

git-push: ## Push changes to remote
	@echo "Pushing changes to remote..."
	git push origin main

# Environment setup
env-example: ## Copy environment example files
	@echo "Copying environment example files..."
	cp env.example .env
	cd backend && cp .env.example .env

# Performance testing
perf-test: ## Run performance tests
	@echo "Running performance tests..."
	@echo "Performance testing not implemented yet"

load-test: ## Run load tests
	@echo "Running load tests..."
	@echo "Load testing not implemented yet"

# Documentation
docs-build: ## Build documentation
	@echo "Building documentation..."
	@echo "Documentation build not implemented yet"

docs-serve: ## Serve documentation
	@echo "Serving documentation..."
	@echo "Documentation serve not implemented yet"

# Backup and restore
backup: ## Backup database and files
	@echo "Creating backup..."
	@echo "Backup functionality not implemented yet"

restore: ## Restore from backup
	@echo "Restoring from backup..."
	@echo "Restore functionality not implemented yet"

# Network utilities
network-start: ## Start local blockchain network
	@echo "Starting local blockchain network..."
	cd contracts && npx hardhat node

network-accounts: ## Show network accounts
	@echo "Network accounts:"
	cd contracts && npx hardhat accounts

network-balance: ## Show account balances
	@echo "Account balances:"
	cd contracts && npx hardhat balance

# Smart contract utilities
contract-verify: ## Verify contracts on Etherscan
	@echo "Verifying contracts..."
	npm run verify

contract-size: ## Check contract sizes
	@echo "Checking contract sizes..."
	cd contracts && npx hardhat size-contracts

contract-gas: ## Estimate gas costs
	@echo "Estimating gas costs..."
	cd contracts && npx hardhat gas-reporter

# Development utilities
dev-reset: ## Reset development environment
	@echo "Resetting development environment..."
	make clean
	make install
	make db-reset

dev-fresh: ## Fresh development setup
	@echo "Fresh development setup..."
	make clean-all
	make install
	make setup
	make db-reset

# CI/CD
ci-test: ## Run CI tests
	@echo "Running CI tests..."
	npm run test:ci
	make lint
	make type-check

ci-build: ## CI build
	@echo "Running CI build..."
	make build
	make build-contracts

ci-deploy: ## CI deployment
	@echo "Running CI deployment..."
	make deploy-testnet

# Aliases for common commands
start: dev ## Alias for dev
stop: ## Stop all services
	@echo "Stopping all services..."
	docker-compose down
	pkill -f "next dev" || true
	pkill -f "node.*backend" || true

restart: ## Restart all services
	@echo "Restarting all services..."
	make stop
	make start

status: health-check ## Alias for health-check

# Version information
version: ## Show version information
	@echo "GreenLedger Version Information"
	@echo "=============================="
	@echo "Node.js: $(shell node --version)"
	@echo "NPM: $(shell npm --version)"
	@echo "Docker: $(shell docker --version 2>/dev/null || echo 'Not installed')"
	@echo "Git: $(shell git --version)"
	@echo "Project: $(shell grep '"version"' package.json | cut -d'"' -f4)"
