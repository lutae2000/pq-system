ALTER TABLE company_performance_contract_periods
    ADD CONSTRAINT uq_company_performance_contract_period_seq_id UNIQUE (seq, id);

ALTER TABLE pq_engineer_project_history
    ADD COLUMN contract_period_id BIGINT,
    ADD CONSTRAINT ck_engineer_history_contract_period_seq
        CHECK (contract_period_id IS NULL OR seq IS NOT NULL),
    ADD CONSTRAINT fk_engineer_history_contract_period
        FOREIGN KEY (seq, contract_period_id)
        REFERENCES company_performance_contract_periods (seq, id)
        ON DELETE SET NULL (contract_period_id);

CREATE INDEX ix_engineer_history_contract_period
    ON pq_engineer_project_history (seq, contract_period_id)
    WHERE contract_period_id IS NOT NULL;

COMMENT ON COLUMN pq_engineer_project_history.contract_period_id IS '선택한 용역차수별 계약기간 ID';
