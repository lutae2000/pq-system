ALTER TABLE new_technology_usages
    DROP CONSTRAINT IF EXISTS ck_new_technology_usages_base_score;

ALTER TABLE new_technology_usages
    DROP COLUMN IF EXISTS base_score;