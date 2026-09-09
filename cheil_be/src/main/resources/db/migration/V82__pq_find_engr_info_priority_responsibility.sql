ALTER TABLE pq_find_engr_info
    ADD COLUMN IF NOT EXISTS priority INTEGER,
    ADD COLUMN IF NOT EXISTS responsibility VARCHAR(50);

COMMENT ON COLUMN pq_find_engr_info.priority IS '선택 기술인 순번';
COMMENT ON COLUMN pq_find_engr_info.responsibility IS '기술인 책임 정도';
