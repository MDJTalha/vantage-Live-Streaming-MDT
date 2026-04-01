# CI/CD Quick Reference Card

## 🚀 Quick Start

### First Time Setup
1. Go to **Settings > Environments**
2. Create `staging` environment
3. Create `production` environment
4. Push to `develop` to test

### Daily Workflow
```bash
# Work on feature
git checkout -b feature/my-feature
git commit -m "feat: add something"
git push origin feature/my-feature

# Create PR to develop on GitHub
# After merge, staging deployment happens automatically

# For production, create PR from develop to main
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci-cd.yml` | Main CI/CD pipeline |
| `.github/workflows/codeql.yml` | Security analysis |
| `.github/dependabot.yml` | Auto dependency updates |
| `apps/*/Dockerfile` | Docker build configs |
| `packages/*/.eslintrc.js` | Lint configs |

---

## ✅ Pipeline Stages

```
Push → Lint/Test/Build → Security Scan → Docker Build → Deploy
                                              ↓
                                    (staging or production)
```

---

## 🔍 Monitoring

| What | Where |
|------|-------|
| Build status | GitHub Actions tab |
| Security issues | Security tab > Code scanning |
| Docker images | GitHub Packages |
| Deployments | Environments in Settings |

---

## 🐛 Common Issues

### Build fails
```bash
# Test locally
npm ci --legacy-peer-deps
npx turbo run build
```

### Docker fails
```bash
# Test locally
docker build -f apps/api/Dockerfile .
```

### Lint fails
```bash
# Check .eslintrc.js exists
# Run: npx turbo run lint
```

---

## 📊 Build Times

| Stage | Expected Time |
|-------|---------------|
| Build | 5-10 min |
| Security | 2-5 min |
| Docker | 5-10 min |
| Deploy | 1-3 min |

**Total:** 15-25 min (first run), 5-10 min (cached)

---

## 🌿 Branch Strategy

| Branch | Deploys To | Purpose |
|--------|------------|---------|
| `develop` | Staging | Integration |
| `main` | Production | Releases |
| `feature/*` | None | Development |

---

## 🔐 Required Secrets

| Secret | Where | Purpose |
|--------|-------|---------|
| `GITHUB_TOKEN` | Auto | Docker registry |
| `DEPLOY_KEY` | Optional | SSH deployment |
| `KUBE_CONFIG` | Optional | Kubernetes |

---

## 📝 Commands

### Validate workflows
```bash
npx actionlint .github/workflows/*.yml
```

### Test build
```bash
npm ci --legacy-peer-deps
npx turbo run build --no-cache
npx turbo run lint --no-cache
```

### Test Docker
```bash
docker build -f apps/api/Dockerfile -t api-test .
docker build -f apps/web/Dockerfile -t web-test .
```

---

## 📞 Getting Help

1. Check workflow logs in GitHub Actions
2. Review `GITHUB_ACTIONS_COMPLETE_SUMMARY.md`
3. Create issue with `ci-cd-failure` template
4. Check validation report for known issues

---

## ✨ Checklist for PR

- [ ] Code builds locally
- [ ] Tests pass
- [ ] Lint passes
- [ ] Docker builds locally
- [ ] Workflow checks pass
- [ ] Documentation updated (if needed)

---

**Status:** ✅ All workflows operational  
**Last Updated:** March 31, 2026
