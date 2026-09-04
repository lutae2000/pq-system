CREATE TABLE IF NOT EXISTS pq_company_performance_document_targets (
    target_id BIGSERIAL PRIMARY KEY,
    bid_seq BIGINT NOT NULL REFERENCES bid_notices (bid_seq) ON DELETE CASCADE,
    company_performance_seq BIGINT NOT NULL REFERENCES company_performances (seq) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT uq_pq_company_performance_document_targets UNIQUE (bid_seq, company_performance_seq)
);

CREATE INDEX IF NOT EXISTS ix_pq_company_performance_document_targets_bid
    ON pq_company_performance_document_targets (bid_seq);

COMMENT ON TABLE pq_company_performance_document_targets IS '회사실적 문서 생성 대상';
COMMENT ON COLUMN pq_company_performance_document_targets.target_id IS '회사실적 문서 생성 대상 식별자';
COMMENT ON COLUMN pq_company_performance_document_targets.bid_seq IS '문서 생성을 요청한 공고 식별자';
COMMENT ON COLUMN pq_company_performance_document_targets.company_performance_seq IS '문서 생성 대상으로 선택한 회사실적 식별자';
COMMENT ON COLUMN pq_company_performance_document_targets.created_at IS '대상 등록 일시';
COMMENT ON COLUMN pq_company_performance_document_targets.created_id IS '대상을 등록한 사용자';
COMMENT ON COLUMN pq_company_performance_document_targets.last_changed_at IS '대상 최종 변경 일시';
COMMENT ON COLUMN pq_company_performance_document_targets.last_changed_id IS '대상을 최종 변경한 사용자';
