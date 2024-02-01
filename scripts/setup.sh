#!/bin/bash

# GreenLedger Setup Script
# This script sets up the development environment for GreenLedger

set -e

echo "🌱 Setting up GreenLedger development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install contract dependencies
echo "📦 Installing smart contract dependencies..."
cd contracts
npm install
cd ..

# Copy environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "🔧 Creating environment file..."
    cp env.example .env.local
    echo "⚠️  Please update .env.local with your configuration"
fi

# Create data directory
mkdir -p data

# Compile contracts
echo "🔨 Compiling smart contracts..."
cd contracts
npm run compile
cd ..

# Run tests to verify setup
echo "🧪 Running tests to verify setup..."
npm test -- --passWithNoTests

# Build the application
echo "🏗️  Building application..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Start development server: npm run dev"
echo "3. Deploy contracts: cd contracts && npm run deploy:local"
echo ""
echo "For more information, see README.md"
