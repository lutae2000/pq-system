ALTER TABLE education_management
    DROP CONSTRAINT IF EXISTS uq_education_management_engineer_code;

CREATE INDEX IF NOT EXISTS ix_education_management_engineer_code
    ON education_management (engr_id, education_code);
