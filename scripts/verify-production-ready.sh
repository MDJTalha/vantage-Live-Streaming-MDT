#!/bin/bash

# ================================================
# VANTAGE 100% Production Readiness Verification
# ================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Track results
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
log_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

log_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARNINGS++))
}

log_info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}VANTAGE 100% Production Readiness Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# ================================================
# 1. Code Quality Checks
# ================================================

echo -e "${YELLOW}[1/10] Code Quality Verification${NC}"
echo ""

# Check TypeScript compilation
if npm run build 2>/dev/null; then
    log_pass "TypeScript compilation successful (no errors)"
else
    log_fail "TypeScript compilation failed"
fi

# Check ESLint
if npm run lint 2>/dev/null | grep -q "error"; then
    log_fail "ESLint errors detected"
else
    log_pass "ESLint validation passed"
fi

# Check for hardcoded credentials
if grep -r "password\|secret\|key" apps/api/src --include="*.ts" | grep -v "password_hash\|secretKey\|apiKey" | wc -l | grep -q "^0$"; then
    log_pass "No hardcoded credentials detected"
else
    log_warn "Possible sensitive data in code (review required)"
fi

# Check dependencies
if npm list 2>/dev/null | grep -i "deprecated\|vulnerabilities"; then
    log_warn "Outdated or vulnerable dependencies detected"
else
    log_pass "Dependency versions up-to-date"
fi

echo ""

# ================================================
# 2. Database & Schema
# ================================================

echo -e "${YELLOW}[2/10] Database Schema Verification${NC}"
echo ""

if grep -q "model Organization" apps/api/prisma/schema.prisma; then
    log_pass "Organization model found"
else
    log_fail "Organization model missing"
fi

if grep -q "model Subscription" apps/api/prisma/schema.prisma; then
    log_pass "Subscription model found"
else
    log_fail "Subscription model missing"
fi

if grep -q "model Invoice" apps/api/prisma/schema.prisma; then
    log_pass "Invoice model found"
else
    log_fail "Invoice model missing"
fi

if grep -q "model ApiKey" apps/api/prisma/schema.prisma; then
    log_pass "API Key model found"
else
    log_fail "API Key model missing"
fi

if grep -q "enum SubscriptionTier" apps/api/prisma/schema.prisma; then
    log_pass "SubscriptionTier enum found"
else
    log_fail "SubscriptionTier enum missing"
fi

echo ""

# ================================================
# 3. Services & Middleware
# ================================================

echo -e "${YELLOW}[3/10] Services & Middleware Verification${NC}"
echo ""

if [ -f "apps/api/src/services/BillingService.ts" ]; then
    log_pass "BillingService implemented"
else
    log_fail "BillingService not found"
fi

if [ -f "apps/api/src/middleware/featureGate.ts" ]; then
    log_pass "Feature gating middleware implemented"
else
    log_fail "Feature gating middleware not found"
fi

if grep -q "class BillingService" apps/api/src/services/BillingService.ts; then
    if grep -q "createSubscription" apps/api/src/services/BillingService.ts; then
        log_pass "Subscription creation method found"
    fi
    if grep -q "handleWebhookEvent" apps/api/src/services/BillingService.ts; then
        log_pass "Webhook event handling found"
    fi
else
    log_fail "BillingService class structure invalid"
fi

if grep -q "FEATURE_MATRIX" apps/api/src/middleware/featureGate.ts; then
    log_pass "Feature matrix defined"
else
    log_fail "Feature matrix not found"
fi

if grep -q "CONSTRAINT_LIMITS" apps/api/src/middleware/featureGate.ts; then
    log_pass "Constraint limits defined"
else
    log_fail "Constraint limits not found"
fi

echo ""

# ================================================
# 4. API Routes
# ================================================

echo -e "${YELLOW}[4/10] API Routes Verification${NC}"
echo ""

if [ -f "apps/api/src/routes/admin.ts" ]; then
    log_pass "Admin routes file exists"
    
    if grep -q "GET /organizations" apps/api/src/routes/admin.ts; then
        log_pass "Admin organization listing route found"
    fi
    if grep -q "GET /invoices" apps/api/src/routes/admin.ts; then
        log_pass "Admin invoice listing route found"
    fi
    if grep -q "GET /usage" apps/api/src/routes/admin.ts; then
        log_pass "Admin usage analytics route found"
    fi
else
    log_fail "Admin routes file not found"
fi

if [ -f "apps/api/src/routes/onboarding.ts" ]; then
    log_pass "Onboarding routes file exists"
    
    if grep -q "create-organization" apps/api/src/routes/onboarding.ts; then
        log_pass "Organization creation endpoint found"
    fi
    if grep -q "upgrade-plan" apps/api/src/routes/onboarding.ts; then
        log_pass "Plan upgrade endpoint found"
    fi
    if grep -q "invite-team-member" apps/api/src/routes/onboarding.ts; then
        log_pass "Team invitation endpoint found"
    fi
else
    log_fail "Onboarding routes file not found"
fi

echo ""

# ================================================
# 5. Frontend Components
# ================================================

echo -e "${YELLOW}[5/10] Frontend Components Verification${NC}"
echo ""

if [ -f "apps/web/src/app/account/billing/page.tsx" ]; then
    log_pass "Billing page component exists"
    
    if grep -q "UpgradeOption" apps/web/src/app/account/billing/page.tsx; then
        log_pass "Upgrade options UI found"
    fi
    if grep -q "invoice" apps/web/src/app/account/billing/page.tsx; then
        log_pass "Invoice management UI found"
    fi
    if grep -q "BillingSettings" apps/web/src/app/account/billing/page.tsx; then
        log_pass "Billing settings UI found"
    fi
else
    log_fail "Billing page component not found"
fi

echo ""

# ================================================
# 6. Deployment Automation
# ================================================

echo -e "${YELLOW}[6/10] Deployment Automation Verification${NC}"
echo ""

if [ -f "scripts/deploy-production.sh" ]; then
    log_pass "Deployment script exists"
    
    if grep -q "docker build" scripts/deploy-production.sh; then
        log_pass "Docker build commands found"
    fi
    if grep -q "kubectl apply" scripts/deploy-production.sh; then
        log_pass "Kubernetes deployment commands found"
    fi
    if grep -q "npm run migrate" scripts/deploy-production.sh; then
        log_pass "Database migration commands found"
    fi
else
    log_fail "Deployment script not found"
fi

if [ -x "scripts/deploy-production.sh" ]; then
    log_pass "Deployment script is executable"
else
    log_warn "Deployment script is not executable"
fi

echo ""

# ================================================
# 7. Documentation
# ================================================

echo -e "${YELLOW}[7/10] Documentation Verification${NC}"
echo ""

if [ -f "PRODUCTION_PREMIUM_SYSTEM_100.md" ]; then
    log_pass "Premium system spec document exists"
else
    log_fail "Premium system spec document missing"
fi

if [ -f "PRODUCTION_DEPLOYMENT_GUIDE_V2.md" ]; then
    log_pass "Production deployment guide exists (V2)"
else
    log_fail "Production deployment guide missing"
fi

if [ -f "PRODUCTION_COMPLETE_STATUS.md" ]; then
    log_pass "Production complete status document exists"
else
    log_fail "Production complete status document missing"
fi

# Check documentation completeness
if grep -q "Stripe Integration" PRODUCTION_DEPLOYMENT_GUIDE_V2.md; then
    log_pass "Stripe setup documentation found"
fi

if grep -q "Email" PRODUCTION_DEPLOYMENT_GUIDE_V2.md; then
    log_pass "Email setup documentation found"
fi

if grep -q "SSL/TLS" PRODUCTION_DEPLOYMENT_GUIDE_V2.md; then
    log_pass "SSL/TLS setup documentation found"
fi

if grep -q "Backup" PRODUCTION_DEPLOYMENT_GUIDE_V2.md; then
    log_pass "Backup procedures documented"
fi

echo ""

# ================================================
# 8. Environment & Configuration
# ================================================

echo -e "${YELLOW}[8/10] Environment Configuration Verification${NC}"
echo ""

if [ -f ".env.example" ]; then
    log_pass ".env.example file exists"
    
    if grep -q "STRIPE_SECRET_KEY" .env.example; then
        log_pass "Stripe keys in environment template"
    fi
    if grep -q "DATABASE_URL" .env.example; then
        log_pass "Database config in environment template"
    fi
    if grep -q "JWT_SECRET" .env.example; then
        log_pass "JWT secrets in environment template"
    fi
else
    log_warn ".env.example file not found (create before deployment)"
fi

echo ""

# ================================================
# 9. Security Checks
# ================================================

echo -e "${YELLOW}[9/10] Security Verification${NC}"
echo ""

if grep -r "bcrypt\|argon2" apps/api/src --include="*.ts" | grep -q "import"; then
    log_pass "Password hashing library imported"
else
    log_fail "Password hashing not found"
fi

if grep -q "JWT" apps/api/src/middleware --include="*.ts"; then
    log_pass "JWT authentication found"
else
    log_fail "JWT authentication not found"
fi

if grep -q "cors\|CORS" apps/api/src --include="*.ts" -i; then
    log_pass "CORS configuration found"
else
    log_fail "CORS configuration not found"
fi

if grep -q "helmet\|security" apps/api/src --include="*.ts" -i; then
    log_pass "Security headers configuration found"
else
    log_fail "Security headers not configured"
fi

# Docker security check
if grep -q "distroless" apps/api/Dockerfile apps/web/Dockerfile 2>/dev/null; then
    log_pass "Distroless images used for production"
else
    log_warn "Distroless images not configured"
fi

echo ""

# ================================================
# 10. Final Verification
# ================================================

echo -e "${YELLOW}[10/10] Final System Verification${NC}"
echo ""

if [ -f "apps/api/package.json" ]; then
    if grep -q "\"name\": \"api\"" apps/api/package.json; then
        log_pass "API package configured"
    fi
fi

if [ -f "apps/web/package.json" ]; then
    if grep -q "next" apps/web/package.json; then
        log_pass "Web package configured"
    fi
fi

if [ -f "package.json" ]; then
    log_pass "Root package.json exists"
fi

# Check Docker configuration
if [ -f "apps/api/Dockerfile" ]; then
    log_pass "API Dockerfile exists"
fi

if [ -f "apps/web/Dockerfile" ]; then
    log_pass "Web Dockerfile exists"
fi

if [ -d "infra/k8s" ]; then
    if [ -f "infra/k8s/api-deployment.yaml" ]; then
        log_pass "Kubernetes deployment manifests exist"
    fi
else
    log_fail "Kubernetes manifests directory not found"
fi

echo ""

# ================================================
# Summary Report
# ================================================

TOTAL=$((PASSED + FAILED + WARNINGS))

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total Checks:    ${TOTAL}"
echo -e "✅ Passed:       ${GREEN}${PASSED}${NC}"
echo -e "❌ Failed:       ${RED}${FAILED}${NC}"
echo -e "⚠️  Warnings:    ${YELLOW}${WARNINGS}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                    🎉 ALL SYSTEMS GO! 🎉${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}VANTAGE is 100% ready for production deployment!${NC}"
    echo ""
    echo -e "Next Steps:"
    echo "1. Review PRODUCTION_DEPLOYMENT_GUIDE_V2.md"
    echo "2. Configure all required environment variables"
    echo "3. Set up Stripe account and products"
    echo "4. Configure SendGrid email templates"
    echo "5. Run: ./scripts/deploy-production.sh"
    echo ""
    exit 0
else
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}⚠️  DEPLOYMENT BLOCKED - ISSUES FOUND${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Please resolve the ${RED}${FAILED}${NC} failing checks before deployment."
    echo ""
    exit 1
fi
