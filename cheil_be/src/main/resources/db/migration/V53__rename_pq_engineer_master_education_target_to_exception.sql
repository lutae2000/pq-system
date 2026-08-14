ALTER TABLE pq_engineer_master
    RENAME COLUMN education_target TO education_exception;

UPDATE pq_engineer_master
SET education_exception = NOT COALESCE(education_exception, FALSE);

ALTER TABLE pq_engineer_master
    ALTER COLUMN education_exception SET DEFAULT FALSE;

COMMENT ON COLUMN pq_engineer_master.education_exception IS '교육 예외 여부';
