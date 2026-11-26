CREATE TABLE IF NOT EXISTS service_performances (
    id BIGSERIAL PRIMARY KEY,
    client_code VARCHAR(30) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    site_name VARCHAR(200) NOT NULL,
    evaluation_date VARCHAR(8) NOT NULL,
    service_amount NUMERIC(15, 2),
    evaluation_score NUMERIC(6, 2),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS ix_service_performances_evaluation_date
    ON service_performances (evaluation_date);
CREATE INDEX IF NOT EXISTS ix_service_performances_client_code
    ON service_performances (client_code);
CREATE INDEX IF NOT EXISTS ix_service_performances_field_name
    ON service_performances (field_name);
CREATE INDEX IF NOT EXISTS ix_service_performances_site_name
    ON service_performances (site_name);

COMMENT ON TABLE service_performances IS '용역 수행성과 관리';
COMMENT ON COLUMN service_performances.id IS '용역 수행성과 ID';
COMMENT ON COLUMN service_performances.client_code IS '발주청 코드';
COMMENT ON COLUMN service_performances.field_name IS '분야';
COMMENT ON COLUMN service_performances.site_name IS '현장명';
COMMENT ON COLUMN service_performances.evaluation_date IS '평가일자';
COMMENT ON COLUMN service_performances.service_amount IS '용역금액';
COMMENT ON COLUMN service_performances.evaluation_score IS '평가점수';
COMMENT ON COLUMN service_performances.remark IS '비고';
COMMENT ON COLUMN service_performances.created_at IS '등록일시';
COMMENT ON COLUMN service_performances.created_id IS '등록자';
COMMENT ON COLUMN service_performances.last_changed_at IS '수정일시';
COMMENT ON COLUMN service_performances.last_changed_id IS '수정자';
