ALTER TABLE new_technology_developments
    ADD COLUMN IF NOT EXISTS use_yn BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE new_technology_developments
    ADD COLUMN IF NOT EXISTS calculated_score NUMERIC(10, 2);

ALTER TABLE new_technology_developments
    ADD CONSTRAINT ck_new_technology_developments_calculated_score
        CHECK (calculated_score IS NULL OR calculated_score >= 0);

COMMENT ON COLUMN new_technology_developments.use_yn IS '사용여부';
COMMENT ON COLUMN new_technology_developments.calculated_score IS '산정 점수';
