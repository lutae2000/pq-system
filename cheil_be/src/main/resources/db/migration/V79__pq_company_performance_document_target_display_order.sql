ALTER TABLE pq_company_performance_document_targets
    ADD COLUMN IF NOT EXISTS display_order INTEGER;

CREATE INDEX IF NOT EXISTS ix_pq_company_performance_document_targets_order
    ON pq_company_performance_document_targets (bid_seq, display_order, target_id);

WITH ranked_targets AS (
    SELECT target_id,
           ROW_NUMBER() OVER (PARTITION BY bid_seq ORDER BY display_order NULLS LAST, target_id) AS sequence_number
    FROM pq_company_performance_document_targets
)
UPDATE pq_company_performance_document_targets target
SET display_order = ranked_targets.sequence_number
FROM ranked_targets
WHERE target.target_id = ranked_targets.target_id;
