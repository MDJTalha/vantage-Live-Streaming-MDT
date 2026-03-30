#!/bin/bash
# Database Restore Script for VANTAGE Executive Platform
# Usage: ./restore.sh <backup_file.sql.gz>

set -e

if [ -z "$1" ]; then
    echo "❌ Please specify backup file"
    echo "Usage: ./restore.sh <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${DB_NAME:-vantage}"
DB_USER="${DB_USER:-vantage}"
DB_HOST="${DB_HOST:-localhost}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "⚠️  WARNING: This will restore database '${DB_NAME}' from backup"
echo "📁 Backup file: ${BACKUP_FILE}"
read -p "Are you sure? This will overwrite current data! (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo "🔄 Starting restore at $(date)"

# Create temporary database for testing
TEMP_DB="${DB_NAME}_restore_test_$$"

echo "💾 Restoring to temporary database for verification..."
gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${TEMP_DB};"
gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -U "${DB_USER}" "${TEMP_DB}"

echo "✅ Restore to temporary database successful"
read -p "Restore to production database? (yes/no): " -r
echo

if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "🔄 Restoring to production database..."
    psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
    psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};"
    gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -U "${DB_USER}" "${DB_NAME}"
    
    echo "✅ Production restore completed"
    
    # Cleanup temp database
    psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${TEMP_DB};"
else
    echo "❌ Production restore cancelled"
    echo "💡 Temporary database '${TEMP_DB}' still exists for manual inspection"
    psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${TEMP_DB};"
    exit 1
fi

echo "✅ Restore completed at $(date)"
