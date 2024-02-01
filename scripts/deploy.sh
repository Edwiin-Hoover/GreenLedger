#!/bin/bash

# GreenLedger Deployment Script
# This script handles deployment to different environments

set -e

# Default values
ENVIRONMENT="production"
BUILD_ONLY=false
SKIP_TESTS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -e, --environment ENV    Set deployment environment (production|staging|development)"
            echo "  --build-only            Only build, don't deploy"
            echo "  --skip-tests            Skip running tests"
            echo "  -h, --help              Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🚀 GreenLedger Deployment Script"
echo "Environment: $ENVIRONMENT"
echo ""

# Validate environment
case $ENVIRONMENT in
    production|staging|development)
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid environments: production, staging, development"
        exit 1
        ;;
esac

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests unless skipped
if [ "$SKIP_TESTS" = false ]; then
    echo "🧪 Running tests..."
    npm test
    
    echo "🔨 Testing smart contracts..."
    cd contracts
    npm test
    cd ..
fi

# Build the application
echo "🏗️  Building application..."
npm run build

if [ "$BUILD_ONLY" = true ]; then
    echo "✅ Build completed successfully!"
    exit 0
fi

# Deploy based on environment
case $ENVIRONMENT in
    production)
        echo "🌐 Deploying to production..."
        
        # Deploy smart contracts to mainnet
        echo "📜 Deploying smart contracts to mainnet..."
        cd contracts
        npm run deploy:mainnet
        cd ..
        
        # Deploy to Vercel production
        if command -v vercel >/dev/null 2>&1; then
            echo "🚀 Deploying to Vercel production..."
            vercel --prod --yes
        else
            echo "⚠️  Vercel CLI not found, skipping Vercel deployment"
        fi
        ;;
        
    staging)
        echo "🔧 Deploying to staging..."
        
        # Deploy smart contracts to testnet
        echo "📜 Deploying smart contracts to testnet..."
        cd contracts
        npm run deploy:goerli
        cd ..
        
        # Deploy to Vercel staging
        if command -v vercel >/dev/null 2>&1; then
            echo "🚀 Deploying to Vercel staging..."
            vercel --yes
        else
            echo "⚠️  Vercel CLI not found, skipping Vercel deployment"
        fi
        ;;
        
    development)
        echo "💻 Setting up development environment..."
        
        # Start local blockchain
        echo "⛓️  Starting local blockchain..."
        cd contracts
        npm run node &
        sleep 5
        
        # Deploy contracts locally
        echo "📜 Deploying smart contracts locally..."
        npm run deploy:local
        cd ..
        
        echo "✅ Development environment ready!"
        echo "💡 Run 'npm run dev' to start the development server"
        ;;
esac

echo ""
echo "✅ Deployment completed successfully!"
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $(date)"
