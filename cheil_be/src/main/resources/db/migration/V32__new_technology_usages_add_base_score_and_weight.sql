ALTER TABLE new_technology_usages
    ADD COLUMN IF NOT EXISTS base_score NUMERIC(10, 2);

ALTER TABLE new_technology_usages
    ADD COLUMN IF NOT EXISTS weight NUMERIC(10, 2);

ALTER TABLE new_technology_usages
    ADD CONSTRAINT ck_new_technology_usages_base_score
        CHECK (base_score IS NULL OR base_score >= 0);

ALTER TABLE new_technology_usages
    ADD CONSTRAINT ck_new_technology_usages_weight
        CHECK (weight IS NULL OR weight >= 0);

COMMENT ON COLUMN new_technology_usages.base_score IS '기준점수';
COMMENT ON COLUMN new_technology_usages.weight IS '가중치';
