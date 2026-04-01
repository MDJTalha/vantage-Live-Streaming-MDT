# CI/CD Pipeline Documentation

## Overview

This document describes the CI/CD pipeline configuration for the Vantage live streaming platform.

## Workflow Files

### 1. `ci-cd.yml` - Main CI/CD Pipeline

The main pipeline consists of 5 stages:

#### Stage 1: Lint, Test & Build
- **Trigger**: Push to `main` or `develop`, PRs to `main` or `develop`
- **Runs on**: `ubuntu-latest`
- **Steps**:
  1. Checkout code
  2. Setup Node.js 20.13.0
  3. Cache node_modules
  4. Install dependencies
  5. Build all packages using Turbo
  6. Run linter
  7. Run tests
  8. Upload build artifacts

#### Stage 2: Security Scan
- **Trigger**: Push to `main` only
- **Runs on**: `ubuntu-latest`
- **Steps**:
  1. Checkout code
  2. Setup Node.js
  3. Install dependencies
  4. Run npm audit
  5. Run Trivy vulnerability scanner
  6. Upload results to GitHub Security tab

#### Stage 3: Build Docker Images
- **Trigger**: Push to `main`
- **Depends on**: `lint-and-build`
- **Runs on**: `ubuntu-latest`
- **Matrix builds**: `api`, `media-server`
- **Steps**:
  1. Checkout repository
  2. Setup Docker Buildx
  3. Login to GHCR
  4. Extract metadata
  5. Build and push Docker images

#### Stage 4: Deploy to Staging
- **Trigger**: Push to `develop`
- **Depends on**: `build-docker`
- **Environment**: `staging`
- **Steps**:
  1. Checkout repository
  2. Download build artifacts
  3. Deploy to staging

#### Stage 5: Deploy to Production
- **Trigger**: Push to `main`
- **Depends on**: `build-docker`
- **Environment**: `production`
- **Steps**:
  1. Checkout repository
  2. Download build artifacts
  3. Deploy to production

### 2. `codeql.yml` - CodeQL Analysis

- **Trigger**: Manual (`workflow_dispatch`)
- **Purpose**: Optional security scanning
- **Languages**: JavaScript/TypeScript, Python

### 3. `dependabot.yml` - Automated Dependency Updates

- **npm**: Weekly updates on Monday
- **Docker**: Weekly updates for each app
- **GitHub Actions**: Weekly updates

## Branch Strategy

| Branch | Deployments | Description |
|--------|-------------|-------------|
| `main` | Production | Stable, production-ready code |
| `develop` | Staging | Integration branch for features |

## Environments

### Staging
- **URL**: https://staging.vantage.example.com
- **Branch**: `develop`
- **Purpose**: Testing and QA

### Production
- **URL**: https://vantage.example.com
- **Branch**: `main`
- **Purpose**: Live production environment

## Docker Images

Images are pushed to GitHub Container Registry (GHCR):

- `ghcr.io/{owner}/vantage-api-{tag}`
- `ghcr.io/{owner}/vantage-media-server-{tag}`

Tags include:
- Branch name (e.g., `main`, `develop`)
- SHA prefix (e.g., `api-abc1234`)
- Semantic version (if tagged)

## Required Secrets

Configure these secrets in GitHub Repository Settings > Secrets and variables > Actions:

### For Docker Publishing (automatic)
- `GITHUB_TOKEN` - Automatically provided

### For Deployment (configure as needed)
- `DEPLOY_KEY` - SSH key for deployment server
- `KUBE_CONFIG` - Kubernetes config (if using K8s)
- `AWS_ACCESS_KEY_ID` - For AWS deployments
- `AWS_SECRET_ACCESS_KEY` - For AWS deployments

## Local Testing

### Test the build locally
```bash
npm ci --legacy-peer-deps
npx turbo run build --no-cache
npx turbo run lint --no-cache
npx turbo run test --no-cache
```

### Test Docker builds locally
```bash
# Build API image
docker build -f apps/api/Dockerfile -t vantage-api .

# Build Media Server image
docker build -f apps/media-server/Dockerfile -t vantage-media-server .

# Build Web image
docker build -f apps/web/Dockerfile -t vantage-web .
```

### Validate workflow syntax
```bash
# Install actionlint
brew install actionlint

# Validate workflows
actionlint .github/workflows/*.yml
```

## Troubleshooting

### Build fails
1. Check the "Lint, Test & Build" job logs
2. Run build locally to reproduce
3. Check for TypeScript errors
4. Verify all dependencies are installed

### Docker build fails
1. Check the "Build Docker Images" job logs
2. Test Docker build locally
3. Verify base image availability
4. Check for native module compilation issues

### Deployment fails
1. Check environment configuration
2. Verify secrets are set correctly
3. Check deployment script logs
4. Verify target environment is accessible

## Monitoring

- **Workflow runs**: GitHub Actions tab
- **Security alerts**: Security tab > Dependabot & Code scanning
- **Docker images**: GitHub Packages

## Maintenance

### Updating Node.js version
1. Update `node-version` in all workflow files
2. Update Dockerfiles base images
3. Test locally before committing

### Adding new services
1. Create Dockerfile in `apps/{service}/Dockerfile`
2. Add service to workflow matrix
3. Add tsconfig and eslint config
4. Update this documentation

## Best Practices

1. **Never commit secrets** - Use GitHub Secrets
2. **Keep workflows DRY** - Use reusable workflows if needed
3. **Test locally** - Always test changes locally first
4. **Monitor builds** - Fix failing builds immediately
5. **Keep dependencies updated** - Review Dependabot PRs
6. **Use environments** - Protect production deployments
7. **Cache aggressively** - Speed up builds with caching
