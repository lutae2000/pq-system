DO $$
BEGIN
    IF to_regclass('public.similar_service_performances') IS NULL
       AND to_regclass('public.pq_similar_service_performances') IS NOT NULL THEN
        ALTER TABLE pq_similar_service_performances RENAME TO similar_service_performances;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS similar_service_performances (
    company_performance_seq BIGINT PRIMARY KEY,
    service_name VARCHAR(500),
    construction_type VARCHAR(500),
    client VARCHAR(500),
    contract_from_date VARCHAR(8),
    contract_to_date VARCHAR(8),
    construction_from_date VARCHAR(8),
    construction_to_date VARCHAR(8),
    contract_price NUMERIC(10),
    share_ratio NUMERIC(3),
    weight NUMERIC(3, 2),
    summary TEXT,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

ALTER TABLE similar_service_performances
    ADD COLUMN IF NOT EXISTS contract_price NUMERIC(10),
    ADD COLUMN IF NOT EXISTS construction_from_date VARCHAR(8),
    ADD COLUMN IF NOT EXISTS construction_to_date VARCHAR(8);

ALTER TABLE similar_service_performances
    ALTER COLUMN summary TYPE TEXT,
    ALTER COLUMN remark TYPE TEXT;

CREATE INDEX IF NOT EXISTS ix_similar_service_performances_service_name
    ON similar_service_performances (service_name);
CREATE INDEX IF NOT EXISTS ix_similar_service_performances_client
    ON similar_service_performances (client);
CREATE INDEX IF NOT EXISTS ix_similar_service_performances_contract_dates
    ON similar_service_performances (contract_from_date, contract_to_date);
