@echo off
echo Running hiring stage migration...
docker exec talentforge-postgres-1 psql -U talentforge -d talentforge -c "ALTER TABLE \"Shortlist\" ADD COLUMN IF NOT EXISTS \"hiringStage\" TEXT NOT NULL DEFAULT 'SHORTLISTED'; ALTER TABLE \"Shortlist\" ADD COLUMN IF NOT EXISTS notes TEXT; ALTER TABLE \"Shortlist\" ADD COLUMN IF NOT EXISTS \"updatedAt\" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now();"
echo Done! Shortlist table updated with hiringStage column.
pause
