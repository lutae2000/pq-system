ALTER TABLE shinindo_managements
    ADD COLUMN IF NOT EXISTS score NUMERIC(10, 2);

ALTER TABLE shinindo_managements
    ADD CONSTRAINT ck_shinindo_managements_score
    CHECK (score IS NULL OR score >= 0);

COMMENT ON COLUMN shinindo_managements.score IS '배점';
