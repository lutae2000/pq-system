ALTER TABLE pq_engineer_project_history_review_results
    ADD COLUMN IF NOT EXISTS display_order INTEGER;

UPDATE pq_engineer_project_history_review_results r
SET display_order = ranked.display_order
FROM (
    SELECT
        review_id,
        ROW_NUMBER() OVER (
            PARTITION BY bid_seq, engineer_id
            ORDER BY created_at NULLS LAST, review_id
        )::INTEGER AS display_order
    FROM pq_engineer_project_history_review_results
) ranked
WHERE r.review_id = ranked.review_id
  AND r.display_order IS NULL;

ALTER TABLE pq_engineer_project_history_review_results
    ALTER COLUMN display_order SET DEFAULT 0;

COMMENT ON COLUMN pq_engineer_project_history_review_results.display_order IS 'Display order in review results';
