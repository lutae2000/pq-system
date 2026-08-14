ALTER TABLE work_overlap_contract_engineers
    ADD COLUMN IF NOT EXISTS pq_target_yn BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN work_overlap_contract_engineers.pq_target_yn IS 'PQ대상자 여부';
