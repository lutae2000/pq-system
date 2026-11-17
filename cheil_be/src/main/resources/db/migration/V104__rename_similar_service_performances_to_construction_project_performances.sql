ALTER TABLE similar_service_performances RENAME TO construction_project_performances;
ALTER TABLE construction_project_performances
    RENAME COLUMN company_performance_seq TO construction_project_performance_seq;
DROP SEQUENCE IF EXISTS similar_service_performances_seq;
DROP SEQUENCE IF EXISTS construction_project_performances_seq;

ALTER INDEX IF EXISTS ix_similar_service_performances_service_name
    RENAME TO ix_construction_project_performances_service_name;
ALTER INDEX IF EXISTS ix_similar_service_performances_client
    RENAME TO ix_construction_project_performances_client;
ALTER INDEX IF EXISTS ix_similar_service_performances_contract_dates
    RENAME TO ix_construction_project_performances_contract_dates;

COMMENT ON TABLE construction_project_performances IS '건설사업 실적관리';
COMMENT ON COLUMN construction_project_performances.construction_project_performance_seq
    IS '건설사업 실적 SEQ';

DO $$
DECLARE
    primary_key_name TEXT;
BEGIN
    SELECT conname INTO primary_key_name
    FROM pg_constraint
    WHERE conrelid = 'construction_project_performances'::regclass
      AND contype = 'p';

    IF primary_key_name IS NOT NULL
       AND primary_key_name <> 'construction_project_performances_pkey' THEN
        EXECUTE format(
            'ALTER TABLE construction_project_performances RENAME CONSTRAINT %I TO construction_project_performances_pkey',
            primary_key_name
        );
    END IF;
END
$$;

UPDATE system_menus
SET menu_name = '건설사업 실적관리',
    description = '건설사업 실적관리 화면',
    last_changed_at = CURRENT_TIMESTAMP
WHERE menu_code = 'pq-similar-service-performances';
