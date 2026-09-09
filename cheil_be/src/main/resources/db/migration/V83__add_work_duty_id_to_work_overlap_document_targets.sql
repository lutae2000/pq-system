ALTER TABLE work_overlap_document_targets
    ADD COLUMN IF NOT EXISTS work_duty_id VARCHAR(50) NOT NULL DEFAULT '';

ALTER TABLE work_overlap_document_targets
    DROP CONSTRAINT IF EXISTS uq_work_overlap_document_targets;

ALTER TABLE work_overlap_document_targets
    ADD CONSTRAINT uq_work_overlap_document_targets
        UNIQUE (work_duty_id, bid_seq, engineer_id, contract_no);

DROP INDEX IF EXISTS ix_work_overlap_document_targets_bid_engineer;

CREATE INDEX IF NOT EXISTS ix_work_overlap_document_targets_work_duty_bid_engineer
    ON work_overlap_document_targets (work_duty_id, bid_seq, engineer_id);

COMMENT ON COLUMN work_overlap_document_targets.work_duty_id IS 'Work duty owner of the document target';
