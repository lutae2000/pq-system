DO $$
BEGIN
    IF to_regclass('public.similar_service_performances') IS NULL
       AND to_regclass('public.pq_similar_service_performances') IS NOT NULL THEN
        ALTER TABLE pq_similar_service_performances RENAME TO similar_service_performances;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_similar_service_performances_service_name
    ON similar_service_performances (service_name);
CREATE INDEX IF NOT EXISTS ix_similar_service_performances_client
    ON similar_service_performances (client);
CREATE INDEX IF NOT EXISTS ix_similar_service_performances_contract_dates
    ON similar_service_performances (contract_from_date, contract_to_date);
