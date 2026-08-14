CREATE TABLE IF NOT EXISTS company_performances (
    seq BIGSERIAL PRIMARY KEY,
    job_seq BIGINT,
    job_name VARCHAR(500),
    job_own_yn VARCHAR(1),
    general_management VARCHAR(1),
    contract_from_date VARCHAR(8),
    contract_to_date VARCHAR(8),
    job_finish_yn VARCHAR(1),
    stop_date VARCHAR(10),
    summary TEXT,
    job_type VARCHAR(20),
    job_ratio VARCHAR(200),
    contract_amt BIGINT,
    own_amt BIGINT,
    order_client VARCHAR(300),
    remark TEXT,
    division_rate NUMERIC(7, 2),
    client_kind VARCHAR(20),
    business_type VARCHAR(20),
    oversee_yn VARCHAR(1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS ix_company_performances_job_name
    ON company_performances (job_name);
CREATE INDEX IF NOT EXISTS ix_company_performances_contract_from_date
    ON company_performances (contract_from_date);
CREATE INDEX IF NOT EXISTS ix_company_performances_contract_to_date
    ON company_performances (contract_to_date);
CREATE INDEX IF NOT EXISTS ix_company_performances_business_type
    ON company_performances (business_type);
CREATE INDEX IF NOT EXISTS ix_company_performances_client_kind
    ON company_performances (client_kind);
CREATE INDEX IF NOT EXISTS ix_company_performances_status_flags
    ON company_performances (job_own_yn, general_management, job_finish_yn, oversee_yn);

COMMENT ON TABLE company_performances IS '회사실적 관리';
COMMENT ON COLUMN company_performances.seq IS '회사실적 SEQ';
COMMENT ON COLUMN company_performances.job_seq IS '기존 시스템 JOB_SEQ';
COMMENT ON COLUMN company_performances.job_name IS '용역명';
COMMENT ON COLUMN company_performances.job_own_yn IS '자사 여부';
COMMENT ON COLUMN company_performances.general_management IS '총괄 여부';
COMMENT ON COLUMN company_performances.contract_from_date IS '계약 시작일';
COMMENT ON COLUMN company_performances.contract_to_date IS '계약 종료일';
COMMENT ON COLUMN company_performances.job_finish_yn IS '완료 여부';
COMMENT ON COLUMN company_performances.stop_date IS '중지일';
COMMENT ON COLUMN company_performances.summary IS '개요';
COMMENT ON COLUMN company_performances.job_type IS '직무 유형 코드';
COMMENT ON COLUMN company_performances.job_ratio IS '지분율 원본값';
COMMENT ON COLUMN company_performances.contract_amt IS '계약 금액';
COMMENT ON COLUMN company_performances.own_amt IS '당사 금액';
COMMENT ON COLUMN company_performances.order_client IS '발주처';
COMMENT ON COLUMN company_performances.remark IS '비고';
COMMENT ON COLUMN company_performances.division_rate IS '지분율';
COMMENT ON COLUMN company_performances.client_kind IS '발주처 구분 코드';
COMMENT ON COLUMN company_performances.business_type IS '사업 유형 코드';
COMMENT ON COLUMN company_performances.oversee_yn IS '해외 여부';
