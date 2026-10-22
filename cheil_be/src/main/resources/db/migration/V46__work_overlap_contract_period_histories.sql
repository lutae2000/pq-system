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
COMMENT ON COLUMN work_overlap_contract_period_histories.change_reason IS '변경 사유';

COMMENT ON TABLE work_overlap_contract_period_histories IS '업무중복도 계약기간 변경 이력';
COMMENT ON COLUMN work_overlap_contract_period_histories.created_at IS '생성 시각';
COMMENT ON COLUMN work_overlap_contract_period_histories.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN work_overlap_contract_period_histories.contract_no IS '계약번호';
COMMENT ON COLUMN work_overlap_contract_period_histories.period_name IS '기간 필드명';
COMMENT ON COLUMN work_overlap_contract_period_histories.before_value IS '변경 전 값';
COMMENT ON COLUMN work_overlap_contract_period_histories.after_value IS '변경 후 값';
COMMENT ON COLUMN work_overlap_contract_period_histories.change_content IS '변경 내용';
