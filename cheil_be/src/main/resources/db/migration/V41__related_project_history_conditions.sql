CREATE TABLE IF NOT EXISTS pq_related_project_history_conditions (
    bid_seq BIGINT PRIMARY KEY REFERENCES bid_notices (bid_seq) ON DELETE CASCADE,
    conditions_json TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

COMMENT ON TABLE pq_related_project_history_conditions IS 'Related project history search conditions by bid notice';
COMMENT ON COLUMN pq_related_project_history_conditions.bid_seq IS 'Bid notice seq';
COMMENT ON COLUMN pq_related_project_history_conditions.conditions_json IS 'Related project history conditions JSON';
COMMENT ON COLUMN pq_related_project_history_conditions.created_at IS 'Created at';
COMMENT ON COLUMN pq_related_project_history_conditions.created_id IS 'Created by';
COMMENT ON COLUMN pq_related_project_history_conditions.last_changed_at IS 'Last changed at';
COMMENT ON COLUMN pq_related_project_history_conditions.last_changed_id IS 'Last changed by';
