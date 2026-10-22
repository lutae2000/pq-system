CREATE TABLE IF NOT EXISTS pq_engineer_project_history_review_results (
    review_id BIGSERIAL PRIMARY KEY,
    bid_seq BIGINT NOT NULL REFERENCES bid_notices (bid_seq) ON DELETE CASCADE,
    engr_id VARCHAR(20) NOT NULL REFERENCES pq_engineer_master (engr_id) ON DELETE CASCADE,
    source_seq INTEGER NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT uq_pq_engineer_project_history_review_results UNIQUE (bid_seq, engr_id, source_seq)
);

CREATE INDEX IF NOT EXISTS ix_pq_engineer_project_history_review_results_bid_engineer
    ON pq_engineer_project_history_review_results (bid_seq, engr_id);
CREATE INDEX IF NOT EXISTS ix_pq_engineer_project_history_review_results_source_seq
    ON pq_engineer_project_history_review_results (engr_id, source_seq);
COMMENT ON COLUMN pq_engineer_project_history_review_results.display_order IS '표시 순서';

COMMENT ON TABLE pq_engineer_project_history_review_results IS '기술인 프로젝트 이력 평가 결과';
COMMENT ON COLUMN pq_engineer_project_history_review_results.review_id IS '평가 결과 식별자';
COMMENT ON COLUMN pq_engineer_project_history_review_results.bid_seq IS '공고문 식별자';
COMMENT ON COLUMN pq_engineer_project_history_review_results.engr_id IS '기술인 식별자';
COMMENT ON COLUMN pq_engineer_project_history_review_results.source_seq IS '원본 프로젝트 이력 식별자';
COMMENT ON COLUMN pq_engineer_project_history_review_results.created_at IS '생성 시각';
COMMENT ON COLUMN pq_engineer_project_history_review_results.created_id IS '생성자';
COMMENT ON COLUMN pq_engineer_project_history_review_results.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_engineer_project_history_review_results.last_changed_id IS '최종 변경자';
