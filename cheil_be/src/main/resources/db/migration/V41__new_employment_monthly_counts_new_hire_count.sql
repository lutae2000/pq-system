ALTER TABLE new_employment_monthly_counts
    ADD COLUMN IF NOT EXISTS new_hire_count INTEGER NOT NULL DEFAULT 0;

UPDATE new_employment_monthly_counts
SET new_hire_count = COALESCE(new_hire_count, 0)
WHERE new_hire_count IS NULL;
