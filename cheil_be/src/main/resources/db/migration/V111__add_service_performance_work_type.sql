ALTER TABLE service_performances
    ADD COLUMN work_type VARCHAR(11),
    ADD CONSTRAINT ck_service_performances_work_type
        CHECK (work_type IN ('DESIGN', 'SUPERVISION'));

CREATE INDEX ix_service_performances_work_type ON service_performances (work_type);

COMMENT ON COLUMN service_performances.work_type IS '업무 구분 (DESIGN: 설계, SUPERVISION: 감리, NULL: 기존 미지정)';
