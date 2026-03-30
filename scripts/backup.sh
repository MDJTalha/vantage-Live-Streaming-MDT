#!/bin/bash
# Automated Backup Script for VANTAGE Executive Platform
# Runs daily via cron, keeps 30 days of backups

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/vantage}"
DB_NAME="${DB_NAME:-vantage}"
DB_USER="${DB_USER:-vantage}"
DB_HOST="${DB_HOST:-localhost}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/vantage_${TIMESTAMP}.sql.gz"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "🔄 Starting backup at $(date)"
echo "📁 Backup file: ${BACKUP_FILE}"

# PostgreSQL backup
echo "💾 Dumping database..."
pg_dump -h "${DB_HOST}" -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

# Verify backup
if [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup created successfully (${BACKUP_SIZE})"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Cleanup old backups
echo "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "vantage_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Count remaining backups
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/vantage_*.sql.gz 2>/dev/null | wc -l)
echo "📊 Remaining backups: ${BACKUP_COUNT}"

# Test restore (optional, uncomment for production)
# echo "🧪 Testing restore..."
# gunzip -c "${BACKUP_FILE}" | pg_restore --dbname=test_restore --no-owner --no-privileges

echo "✅ Backup completed at $(date)"

# Send notification (optional - integrate with your alerting system)
# curl -X POST "https://alerts.vantage.live/backup-success" \
#   -H "Content-Type: application/json" \
#   -d "{\"backup_file\": \"${BACKUP_FILE}\", \"size\": \"${BACKUP_SIZE}\"}"
