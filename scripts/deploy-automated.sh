#!/bin/bash

# ============================================
# VANTAGE Automated Deployment Script
# ============================================
# This script automates deployment to GitHub and Vercel
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="MDJTalha/vantage-Live-Streaming-MDT"
VERCEL_PROJECT="vantage-live-streaming"
BRANCH="main"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  VANTAGE Automated Deployment Script  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# Step 1: Pre-deployment Checks
# ============================================
echo -e "${YELLOW}Step 1: Pre-deployment Checks${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js installed: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm installed: $(npm --version)${NC}"

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git installed: $(git --version)${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi
echo -e "${GREEN}✓ Vercel CLI installed: $(vercel --version)${NC}"

echo ""

# ============================================
# Step 2: Build & Test
# ============================================
echo -e "${YELLOW}Step 2: Build & Test${NC}"

# Install dependencies
echo "Installing dependencies..."
npm ci --legacy-peer-deps

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Build web application
echo "Building web application..."
cd apps/web
npm run build -- --no-lint
cd ../..

echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# ============================================
# Step 3: Commit & Push to GitHub
# ============================================
echo -e "${YELLOW}Step 3: Commit & Push to GitHub${NC}"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "Found uncommitted changes. Committing..."
    git add -A
    git commit -m "chore: automated deployment $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Push to GitHub
echo "Pushing to GitHub..."
git push origin $BRANCH

echo -e "${GREEN}✓ Pushed to GitHub${NC}"
echo ""

# ============================================
# Step 4: Deploy to Vercel
# ============================================
echo -e "${YELLOW}Step 4: Deploy to Vercel${NC}"

# Check Vercel authentication
if [ ! -f ~/.vercel/auth.json ]; then
    echo -e "${YELLOW}⚠ Not authenticated with Vercel. Please login...${NC}"
    vercel login
fi

# Deploy to Vercel
echo "Deploying to Vercel..."
cd apps/web
vercel --prod --yes
cd ../..

echo -e "${GREEN}✓ Deployed to Vercel${NC}"
echo ""

# ============================================
# Step 5: Post-deployment
# ============================================
echo -e "${YELLOW}Step 5: Post-deployment${NC}"

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Deployment Complete!           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "   • Repository: https://github.com/$REPO_NAME"
echo "   • Production: https://$VERCEL_PROJECT.vercel.app"
echo "   • Branch: $BRANCH"
echo "   • Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo -e "${YELLOW}🔗 Quick Links:${NC}"
echo "   • GitHub: https://github.com/$REPO_NAME/actions"
echo "   • Vercel: https://vercel.com/dashboard"
echo ""

# ============================================
# End of Script
# ============================================
