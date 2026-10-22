CREATE TABLE IF NOT EXISTS pq_related_project_history_conditions (
    bid_seq BIGINT PRIMARY KEY REFERENCES bid_notices (bid_seq) ON DELETE CASCADE,
    conditions_json TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

COMMENT ON TABLE pq_related_project_history_conditions IS '공고별 관련 프로젝트 이력 검색 조건';
COMMENT ON COLUMN pq_related_project_history_conditions.bid_seq IS '공고문 식별자';
COMMENT ON COLUMN pq_related_project_history_conditions.conditions_json IS '관련 프로젝트 이력 검색 조건 JSON';
COMMENT ON COLUMN pq_related_project_history_conditions.created_at IS '생성 시각';
COMMENT ON COLUMN pq_related_project_history_conditions.created_id IS '생성자';
COMMENT ON COLUMN pq_related_project_history_conditions.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_related_project_history_conditions.last_changed_id IS '최종 변경자';
