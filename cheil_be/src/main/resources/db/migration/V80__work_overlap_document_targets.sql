CREATE TABLE IF NOT EXISTS work_overlap_document_targets (
    target_id BIGSERIAL PRIMARY KEY,
    bid_seq BIGINT NOT NULL REFERENCES bid_notices (bid_seq) ON DELETE CASCADE,
    engineer_id VARCHAR(50) NOT NULL,
    contract_no VARCHAR(8) NOT NULL REFERENCES work_overlap_contracts (contract_no) ON DELETE CASCADE,
    display_order INTEGER,
    responsibility VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT uq_work_overlap_document_targets UNIQUE (bid_seq, engineer_id, contract_no)
);

CREATE INDEX IF NOT EXISTS ix_work_overlap_document_targets_bid_engineer
    ON work_overlap_document_targets (bid_seq, engineer_id);

COMMENT ON TABLE work_overlap_document_targets IS '업무중복도 문서 생성 대상 계약';
COMMENT ON COLUMN work_overlap_document_targets.target_id IS '업무중복도 문서 생성 대상 식별자';
COMMENT ON COLUMN work_overlap_document_targets.bid_seq IS '문서 생성을 요청한 공고 식별자';
COMMENT ON COLUMN work_overlap_document_targets.engineer_id IS '문서 생성 대상 기술인 식별자';
COMMENT ON COLUMN work_overlap_document_targets.contract_no IS '문서 생성 대상 계약번호';
COMMENT ON COLUMN work_overlap_document_targets.display_order IS '문서 내 계약 표시 순서';
COMMENT ON COLUMN work_overlap_document_targets.responsibility IS '기술인 책임 정도';
COMMENT ON COLUMN work_overlap_document_targets.created_at IS '대상 등록 일시';
COMMENT ON COLUMN work_overlap_document_targets.created_id IS '대상을 등록한 사용자';
COMMENT ON COLUMN work_overlap_document_targets.last_changed_at IS '대상 최종 변경 일시';
COMMENT ON COLUMN work_overlap_document_targets.last_changed_id IS '대상을 최종 변경한 사용자';
