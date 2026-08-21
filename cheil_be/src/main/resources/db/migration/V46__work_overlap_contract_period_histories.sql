CREATE TABLE IF NOT EXISTS work_overlap_contract_period_histories (
    id BIGSERIAL PRIMARY KEY,
    contract_no VARCHAR(8) NOT NULL,
    period_name VARCHAR(100) NOT NULL,
    before_value VARCHAR(8),
    after_value VARCHAR(8),
    change_content TEXT NOT NULL,
    change_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_work_overlap_contract_period_histories_contract
        FOREIGN KEY (contract_no) REFERENCES work_overlap_contracts (contract_no)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_work_overlap_contract_period_histories_contract_no
    ON work_overlap_contract_period_histories (contract_no);

CREATE INDEX IF NOT EXISTS ix_work_overlap_contract_period_histories_created_at
    ON work_overlap_contract_period_histories (created_at DESC, id DESC);

COMMENT ON TABLE work_overlap_contract_period_histories IS 'Work overlap contract period change history';
COMMENT ON COLUMN work_overlap_contract_period_histories.contract_no IS 'Contract number';
COMMENT ON COLUMN work_overlap_contract_period_histories.period_name IS 'Period field name';
COMMENT ON COLUMN work_overlap_contract_period_histories.before_value IS 'Before value';
COMMENT ON COLUMN work_overlap_contract_period_histories.after_value IS 'After value';
COMMENT ON COLUMN work_overlap_contract_period_histories.change_content IS 'Change description';
