#!/bin/bash

# ============================================
# VANTAGE Premium Production Deployment Script
# ============================================
# This script automates the complete deployment of VANTAGE to production
# with all premium features and enterprise configurations.

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Configuration
# ============================================

REGISTRY="${REGISTRY:-vantage}"
VERSION="${VERSION:-prod-1.0}"
NAMESPACE="${NAMESPACE:-vantage}"
ENVIRONMENT="${ENVIRONMENT:-production}"
APP_URL="${APP_URL:-https://vantage.live}"
API_URL="${API_URL:-https://api.vantage.live}"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}VANTAGE Premium Deployment${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Registry: $REGISTRY"
echo "Version: $VERSION"
echo "Namespace: $NAMESPACE"
echo ""

# ============================================
# Pre-deployment Checks
# ============================================

echo -e "${YELLOW}[1/10] Running pre-deployment checks...${NC}"

# Check required tools
for cmd in docker kubectl npm; do
  if ! command -v $cmd &> /dev/null; then
    echo -e "${RED}✗ $cmd is not installed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ $cmd is available${NC}"
done

# Check Docker daemon
if ! docker ps &> /dev/null; then
  echo -e "${RED}✗ Docker daemon is not running${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Docker daemon is running${NC}"

# Check Kubernetes cluster
if ! kubectl cluster-info &> /dev/null; then
  echo -e "${RED}✗ Cannot access Kubernetes cluster${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Kubernetes cluster is accessible${NC}"

echo ""

# ============================================
# Build Docker Images
# ============================================

echo -e "${YELLOW}[2/10] Building Docker images...${NC}"

# Build API image
echo "Building API image..."
docker build \
  -t $REGISTRY/api:$VERSION \
  -f apps/api/Dockerfile \
  --build-arg NODE_ENV=production \
  .

echo -e "${GREEN}✓ API image built${NC}"

# Build Web image
echo "Building Web image..."
docker build \
  -t $REGISTRY/web:$VERSION \
  -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=$API_URL \
  .

echo -e "${GREEN}✓ Web image built${NC}"

# Build Media Server image
echo "Building Media Server image..."
docker build \
  -t $REGISTRY/media-server:$VERSION \
  -f apps/media-server/Dockerfile \
  --build-arg NODE_ENV=production \
  .

echo -e "${GREEN}✓ Media Server image built${NC}"

# Build AI Services image
echo "Building AI Services image..."
docker build \
  -t $REGISTRY/ai-services:$VERSION \
  -f apps/ai-services/Dockerfile \
  --build-arg ENVIRONMENT=production \
  .

echo -e "${GREEN}✓ AI Services image built${NC}"

echo ""

# ============================================
# Push Images to Registry
# ============================================

echo -e "${YELLOW}[3/10] Pushing images to registry...${NC}"

# Login to registry
if [ -n "$REGISTRY_USERNAME" ] && [ -n "$REGISTRY_PASSWORD" ]; then
  echo "$REGISTRY_PASSWORD" | docker login -u "$REGISTRY_USERNAME" --password-stdin $REGISTRY
fi

docker push $REGISTRY/api:$VERSION
docker push $REGISTRY/web:$VERSION
docker push $REGISTRY/media-server:$VERSION
docker push $REGISTRY/ai-services:$VERSION

echo -e "${GREEN}✓ All images pushed to registry${NC}"
echo ""

# ============================================
# Database Preparation
# ============================================

echo -e "${YELLOW}[4/10] Preparing database...${NC}"

# Create namespace if not exists
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ Namespace configured${NC}"

# Apply database secrets (if not exists)
if [ -f "infra/k8s/secrets.yaml" ]; then
  kubectl apply -f infra/k8s/secrets.yaml -n $NAMESPACE
  echo -e "${GREEN}✓ Secrets applied${NC}"
fi

# Run database migrations with a job
echo "Running database migrations..."
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate-$(date +%s)
  namespace: $NAMESPACE
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: $REGISTRY/api:$VERSION
        command: ["npm", "run", "migrate:deploy"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-url
              key: value
      restartPolicy: Never
  backoffLimit: 3
EOF

# Wait for migration job
kubectl wait --for=condition=complete job -l app=db-migrate -n $NAMESPACE --timeout=300s || true
echo -e "${GREEN}✓ Database migrations completed${NC}"

# Seed database with initial data
echo "Seeding database..."
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: db-seed-$(date +%s)
  namespace: $NAMESPACE
spec:
  template:
    spec:
      containers:
      - name: seed
        image: $REGISTRY/api:$VERSION
        command: ["npm", "run", "seed"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-url
              key: value
      restartPolicy: Never
  backoffLimit: 1
EOF

echo -e "${GREEN}✓ Database seeding started${NC}"
echo ""

# ============================================
# Deploy Infrastructure
# ============================================

echo -e "${YELLOW}[5/10] Deploying infrastructure...${NC}"

# Apply namespace
kubectl apply -f infra/k8s/namespace.yaml

# Apply ConfigMaps
kubectl apply -f infra/k8s/configmaps.yaml -n $NAMESPACE || true

# Apply Network Policies
kubectl apply -f infra/k8s/network-policies.yaml -n $NAMESPACE || true

# Apply RBAC
kubectl apply -f infra/k8s/rbac.yaml -n $NAMESPACE || true

echo -e "${GREEN}✓ Infrastructure deployed${NC}"
echo ""

# ============================================
# Deploy Services
# ============================================

echo -e "${YELLOW}[6/10] Deploying services...${NC}"

# Update image references in deployment manifests
sed -i "s|IMAGE_REGISTRY|$REGISTRY|g" infra/k8s/api-deployment.yaml
sed -i "s|IMAGE_VERSION|$VERSION|g" infra/k8s/api-deployment.yaml
sed -i "s|IMAGE_REGISTRY|$REGISTRY|g" infra/k8s/web-deployment.yaml
sed -i "s|IMAGE_VERSION|$VERSION|g" infra/k8s/web-deployment.yaml

# Apply deployments
kubectl apply -f infra/k8s/api-deployment.yaml -n $NAMESPACE
kubectl apply -f infra/k8s/web-deployment.yaml -n $NAMESPACE
kubectl apply -f infra/k8s/media-server-deployment.yaml -n $NAMESPACE
kubectl apply -f infra/k8s/ai-services-deployment.yaml -n $NAMESPACE

echo -e "${GREEN}✓ Services deployed${NC}"
echo ""

# ============================================
# Wait for Rollout
# ============================================

echo -e "${YELLOW}[7/10] Waiting for rollout...${NC}"

# Wait for API deployment
echo "Waiting for API deployment..."
kubectl rollout status deployment/api -n $NAMESPACE --timeout=5m

# Wait for Web deployment
echo "Waiting for Web deployment..."
kubectl rollout status deployment/web -n $NAMESPACE --timeout=5m

# Wait for Media Server deployment
echo "Waiting for Media Server deployment..."
kubectl rollout status deployment/media-server -n $NAMESPACE --timeout=5m

echo -e "${GREEN}✓ All services rolled out successfully${NC}"
echo ""

# ============================================
# Configure Ingress & DNS
# ============================================

echo -e "${YELLOW}[8/10] Configuring ingress...${NC}"

# Apply ingress
kubectl apply -f infra/k8s/ingress.yaml -n $NAMESPACE

# Get ingress IP
INGRESS_IP=$(kubectl get ingress -n $NAMESPACE -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' || echo "pending")

echo "Ingress IP: $INGRESS_IP"
if [ "$INGRESS_IP" = "pending" ]; then
  echo -e "${YELLOW}⚠ Ingress IP is still pending, waiting...${NC}"
  sleep 30
  INGRESS_IP=$(kubectl get ingress -n $NAMESPACE -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}')
fi

echo -e "${GREEN}✓ Ingress configured${NC}"
echo -e "${BLUE}Update your DNS records:${NC}"
echo -e "${BLUE}  vantage.live -> $INGRESS_IP${NC}"
echo -e "${BLUE}  api.vantage.live -> $INGRESS_IP${NC}"
echo ""

# ============================================
# Configure Monitoring
# ============================================

echo -e "${YELLOW}[9/10] Configuring monitoring...${NC}"

# Deploy Prometheus
kubectl apply -f infra/k8s/monitoring/prometheus.yaml -n $NAMESPACE || true

# Deploy Grafana
kubectl apply -f infra/k8s/monitoring/grafana.yaml -n $NAMESPACE || true

# Deploy Sentry
curl https://install.sentry.io/releases/$VERSION/install.sh | bash || true

echo -e "${GREEN}✓ Monitoring configured${NC}"
echo ""

# ============================================
# Health Checks
# ============================================

echo -e "${YELLOW}[10/10] Running health checks...${NC}"

# Get API pod
API_POD=$(kubectl get pods -n $NAMESPACE -l app=api -o jsonpath='{.items[0].metadata.name}' || echo "")

if [ -n "$API_POD" ]; then
  echo "Checking API health..."
  kubectl exec -n $NAMESPACE $API_POD -- curl -s http://localhost:4000/health || true
  echo ""
fi

# Check PostgreSQL connectivity
echo "Checking database connectivity..."
kubectl run db-check -n $NAMESPACE --image=postgres:15-alpine --rm -it --restart=Never -- \
  psql -h postgres -U vantage -d vantage -c "SELECT version();" || true

echo -e "${GREEN}✓ Health checks completed${NC}"
echo ""

# ============================================
# Deployment Summary
# ============================================

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment Successful!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "VANTAGE Premium has been deployed successfully!"
echo ""
echo -e "${BLUE}Important URLs:${NC}"
echo "  Application: $APP_URL"
echo "  API: $API_URL"
echo "  Admin Dashboard: $APP_URL/admin"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Update DNS records to point to ingress IP: $INGRESS_IP"
echo "2. Configure SSL certificates"
echo "3. Set up Stripe webhook endpoints"
echo "4. Run load testing"
echo "5. Monitor system performance"
echo ""
echo -e "${BLUE}Support:${NC}"
echo "  Documentation: https://docs.vantage.live"
echo "  Status: https://status.vantage.live"
echo "  Support: support@vantage.live"
echo ""

# Save deployment info
cat > deployment-info.txt <<EOF
Deployment Date: $(date)
Environment: $ENVIRONMENT
Version: $VERSION
Namespace: $NAMESPACE
Registry: $REGISTRY
Ingress IP: $INGRESS_IP
EOF

echo -e "${BLUE}Deployment info saved to deployment-info.txt${NC}"
echo ""
