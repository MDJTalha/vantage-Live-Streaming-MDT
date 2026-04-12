#!/usr/bin/env bash
set -euo pipefail

REQUIRED_VARS=(
  "DATABASE_URL"
  "REDIS_URL"
  "REDIS_PASSWORD"
  "JWT_SECRET"
  "ENCRYPTION_KEY"
  "TURN_SERVER_URL"
  "TURN_SERVER_USERNAME"
  "TURN_SERVER_PASSWORD"
)

missing=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "ERROR: Missing required environment variables:"
  printf '  - %s\n' "${missing[@]}"
  echo ""
  echo "Set these before running docker-compose."
  exit 1
fi

# Validate JWT secret strength
if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "ERROR: JWT_SECRET must be at least 32 characters (current: ${#JWT_SECRET})"
  echo "Generate with: openssl rand -base64 32"
  exit 1
fi

# Validate encryption key
if [ ${#ENCRYPTION_KEY} -lt 64 ]; then
  echo "ERROR: ENCRYPTION_KEY must be at least 64 hex characters"
  echo "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  exit 1
fi

echo "All environment variables validated successfully"
