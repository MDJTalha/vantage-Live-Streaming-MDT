#!/bin/bash
# Database Backup Script for Production
# Usage: ./scripts/backup-database.sh
# Should be run daily via cron or Kubernetes CronJob

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vantage_db_$TIMESTAMP.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable not set"
  exit 1
fi

# Extract database connection info
# Format: postgresql://user:password@host:port/database
DB_URL="$DATABASE_URL"
DB_USER=$(echo "$DB_URL" | sed -E 's/^([^:]+):\/\/([^:]+):(.*)@.*$/\2/')
DB_PASS=$(echo "$DB_URL" | sed -E 's/^([^:]+):\/\/([^:]+):([^@]+)@.*$/\3/')
DB_HOST=$(echo "$DB_URL" | sed -E 's/^([^:]+):\/\/([^:]+):([^@]+)@([^:]+):?(.*)\/.*$/\4/')
DB_PORT=$(echo "$DB_URL" | sed -E 's/^([^:]+):\/\/([^:]+):([^@]+)@([^:]+):([^\/]+)\/.*$/\5/' || echo "5432")
DB_NAME=$(echo "$DB_URL" | sed -E 's/^.*\/([^?]+).*$/\1/')

# Perform backup
PGPASSWORD="$DB_PASS" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --no-password \
  --verbose \
  --format=plain \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "[$(date)] Backup completed successfully: $BACKUP_FILE"
  ls -lh "$BACKUP_FILE"
  
  # Calculate backup size
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$(date)] Backup size: $SIZE"
  
  # Upload to S3 (if configured)
  if [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "[$(date)] Uploading to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://${S3_BACKUP_BUCKET:-vantage-backups}/"
    echo "[$(date)] S3 upload completed"
  fi
  
  # Cleanup old backups
  echo "[$(date)] Cleaning up backups older than $RETENTION_DAYS days..."
  find "$BACKUP_DIR" -name "vantage_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
  
  echo "[$(date)] Backup script completed successfully"
else
  echo "[$(date)] ERROR: Backup failed"
  exit 1
fi
