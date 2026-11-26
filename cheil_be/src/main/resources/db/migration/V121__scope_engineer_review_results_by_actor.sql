ALTER TABLE pq_engineer_project_history_review_results
    DROP CONSTRAINT uq_pq_engineer_project_history_review_results,
    ADD CONSTRAINT uq_pq_engineer_project_history_review_results
        UNIQUE (bid_seq, engr_id, source_seq, created_id);
