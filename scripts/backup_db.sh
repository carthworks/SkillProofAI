#!/usr/bin/env bash
# ─── TalentForge Nightly PostgreSQL Database Backup Script ───────────────────
# Performs automated pg_dump, compresses with gzip, uploads to AWS S3,
# and enforces a strict 14-day retention cleanup policy.

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/tmp/tf-db-backups}"
S3_BUCKET="${S3_BUCKET:-s3://talentforge-db-backups}"
RETENTION_DAYS=14
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/talentforge_prod_${TIMESTAMP}.sql.gz"

echo "[$(date)] 🚀 Starting TalentForge Nightly Database Backup..."

# 1. Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# 2. Database Connection Check
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set."
  exit 1
fi

# 3. Perform pg_dump and gzip compression
echo "[$(date)] 📦 Dumping PostgreSQL database and compressing with gzip..."
pg_dump "${DATABASE_URL}" | gzip -9 > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] ✅ Database backup created successfully (${FILE_SIZE}): ${BACKUP_FILE}"

# 4. Upload to AWS S3
if command -v aws &> /dev/null; then
  echo "[$(date)] ☁️ Uploading backup to AWS S3: ${S3_BUCKET}/db-backups/..."
  aws s3 cp "${BACKUP_FILE}" "${S3_BUCKET}/db-backups/$(basename "${BACKUP_FILE}")" --storage-class STANDARD_IA

  # 5. Clean up local backups older than 14 days
  echo "[$(date)] 🧹 Enforcing 14-day retention cleanup locally..."
  find "${BACKUP_DIR}" -type f -name "talentforge_prod_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

  # 6. Clean up AWS S3 backups older than 14 days
  echo "[$(date)] 🧹 Enforcing 14-day retention cleanup on AWS S3..."
  CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +"%Y-%m-%d")
  aws s3 ls "${S3_BUCKET}/db-backups/" | while read -r line; do
    FILE_DATE=$(echo "$line" | awk '{print $1}')
    FILE_NAME=$(echo "$line" | awk '{print $4}')
    if [[ -n "$FILE_DATE" && "$FILE_DATE" < "$CUTOFF_DATE" && -n "$FILE_NAME" ]]; then
      echo "Deleting old S3 backup: ${FILE_NAME}"
      aws s3 rm "${S3_BUCKET}/db-backups/${FILE_NAME}"
    fi
  done
else
  echo "⚠️ AWS CLI not installed. Skipping S3 upload. Local backup saved at: ${BACKUP_FILE}"
fi

echo "[$(date)] 🎉 TalentForge Nightly Database Backup Completed Successfully!"
