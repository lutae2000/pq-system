CREATE TABLE IF NOT EXISTS work_overlap_document_engineers (
    target_id BIGSERIAL PRIMARY KEY,
    bid_seq BIGINT NOT NULL REFERENCES bid_notices (bid_seq) ON DELETE CASCADE,
    work_duty_id VARCHAR(100) NOT NULL REFERENCES auth_users (login_id) ON DELETE CASCADE,
    engr_id VARCHAR(50) NOT NULL,
    display_order INTEGER,
    responsibility VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT uq_work_overlap_document_engineers UNIQUE (work_duty_id, bid_seq, engr_id)
);

CREATE INDEX IF NOT EXISTS ix_work_overlap_document_engineers_work_duty_bid
    ON work_overlap_document_engineers (work_duty_id, bid_seq);

COMMENT ON TABLE work_overlap_document_engineers IS '업무중복도 문서 생성 대상 기술인 목록';
COMMENT ON COLUMN work_overlap_document_engineers.target_id IS '업무중복도 문서 대상 기술인 식별자';
COMMENT ON COLUMN work_overlap_document_engineers.bid_seq IS '문서 생성 대상 공고 식별자';
COMMENT ON COLUMN work_overlap_document_engineers.work_duty_id IS '업무 담당자 로그인 ID(auth_users.login_id)';
COMMENT ON COLUMN work_overlap_document_engineers.engr_id IS '업무중복도 문서 생성 대상 기술인 식별자';
COMMENT ON COLUMN work_overlap_document_engineers.display_order IS '선택 기술인 표시 순서';
COMMENT ON COLUMN work_overlap_document_engineers.responsibility IS '기술인 책임 정도';
