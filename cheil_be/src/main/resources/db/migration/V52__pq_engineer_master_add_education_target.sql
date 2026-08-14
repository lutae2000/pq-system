ALTER TABLE pq_engineer_master
    ADD COLUMN education_target BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN pq_engineer_master.education_target IS '교육해당 여부';
