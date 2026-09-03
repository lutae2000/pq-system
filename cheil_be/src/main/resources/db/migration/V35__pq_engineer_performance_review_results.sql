CREATE TABLE IF NOT EXISTS pq_engineer_project_history_review_results (
    review_id BIGSERIAL PRIMARY KEY,
    bid_seq BIGINT NOT NULL REFERENCES bid_notices (bid_seq) ON DELETE CASCADE,
    engineer_id VARCHAR(20) NOT NULL REFERENCES pq_engineer_master (engr_id) ON DELETE CASCADE,
    source_seq INTEGER NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT uq_pq_engineer_project_history_review_results UNIQUE (bid_seq, engineer_id, source_seq)
);

CREATE INDEX IF NOT EXISTS ix_pq_engineer_project_history_review_results_bid_engineer
    ON pq_engineer_project_history_review_results (bid_seq, engineer_id);
CREATE INDEX IF NOT EXISTS ix_pq_engineer_project_history_review_results_source_seq
    ON pq_engineer_project_history_review_results (engineer_id, source_seq);

COMMENT ON TABLE pq_engineer_project_history_review_results IS 'Engineer project history review results';
COMMENT ON COLUMN pq_engineer_project_history_review_results.review_id IS 'Review result id';
COMMENT ON COLUMN pq_engineer_project_history_review_results.bid_seq IS 'Bid notice seq';
COMMENT ON COLUMN pq_engineer_project_history_review_results.engineer_id IS 'Engineer id';
COMMENT ON COLUMN pq_engineer_project_history_review_results.source_seq IS 'Source project history seq';
COMMENT ON COLUMN pq_engineer_project_history_review_results.created_at IS 'Created at';
COMMENT ON COLUMN pq_engineer_project_history_review_results.created_id IS 'Created by';
COMMENT ON COLUMN pq_engineer_project_history_review_results.last_changed_at IS 'Last changed at';
COMMENT ON COLUMN pq_engineer_project_history_review_results.last_changed_id IS 'Last changed by';
