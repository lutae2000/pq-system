CREATE TABLE IF NOT EXISTS company_performance_contract_periods (
    id BIGSERIAL PRIMARY KEY,
    seq BIGINT NOT NULL,
    contract_from_date VARCHAR(8),
    contract_to_date VARCHAR(8),
    sort_seq INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_company_performance_contract_periods_performance
        FOREIGN KEY (seq) REFERENCES company_performances(seq) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_company_performance_contract_periods_seq
    ON company_performance_contract_periods (seq, sort_seq, id);
CREATE INDEX IF NOT EXISTS ix_company_performance_contract_periods_dates
    ON company_performance_contract_periods (contract_from_date, contract_to_date);

COMMENT ON TABLE company_performance_contract_periods IS '회사실적 용역차수별 계약기간';
COMMENT ON COLUMN company_performance_contract_periods.id IS '회사실적 계약기간 ID';
COMMENT ON COLUMN company_performance_contract_periods.seq IS '회사실적 SEQ';
COMMENT ON COLUMN company_performance_contract_periods.contract_from_date IS '계약기간 시작일';
COMMENT ON COLUMN company_performance_contract_periods.contract_to_date IS '계약기간 종료일';
COMMENT ON COLUMN company_performance_contract_periods.sort_seq IS '정렬순서';
COMMENT ON COLUMN company_performance_contract_periods.created_at IS '생성일시';
COMMENT ON COLUMN company_performance_contract_periods.created_id IS '생성자';
COMMENT ON COLUMN company_performance_contract_periods.last_changed_at IS '최종변경일시';
COMMENT ON COLUMN company_performance_contract_periods.last_changed_id IS '최종변경자';
