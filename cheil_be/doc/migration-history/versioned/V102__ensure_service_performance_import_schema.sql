DROP TABLE IF EXISTS service_performances;

CREATE TABLE service_performances (
    id BIGSERIAL PRIMARY KEY,
    construction_no VARCHAR(100) NOT NULL,
    client VARCHAR(300),
    service_name VARCHAR(500) NOT NULL,
    service_category TEXT,
    detail_field TEXT,
    service_fee_thousand NUMERIC(18, 2),
    service_start_date VARCHAR(8),
    service_end_date VARCHAR(8),
    share_rate NUMERIC(7, 2),
    service_amount_million NUMERIC(18, 2),
    score NUMERIC(10, 2),
    evaluation_end_date VARCHAR(8),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT ck_service_performances_share_rate
        CHECK (share_rate IS NULL OR share_rate BETWEEN 0 AND 100)
);

CREATE INDEX ix_service_performances_construction_no
    ON service_performances (construction_no);
CREATE INDEX ix_service_performances_client
    ON service_performances (client);
CREATE INDEX ix_service_performances_service_name
    ON service_performances (service_name);
CREATE INDEX ix_service_performances_service_category
    ON service_performances (service_category);
CREATE INDEX ix_service_performances_detail_field
    ON service_performances (detail_field);
CREATE INDEX ix_service_performances_evaluation_end_date
    ON service_performances (evaluation_end_date);

COMMENT ON TABLE service_performances IS '용역 수행성과';
COMMENT ON COLUMN service_performances.id IS '용역 수행성과 ID';
COMMENT ON COLUMN service_performances.construction_no IS '공사번호';
COMMENT ON COLUMN service_performances.client IS '발주청';
COMMENT ON COLUMN service_performances.service_name IS '용역명';
COMMENT ON COLUMN service_performances.service_category IS '업역분류';
COMMENT ON COLUMN service_performances.detail_field IS '세부분야';
COMMENT ON COLUMN service_performances.service_fee_thousand IS '용역비(천원)';
COMMENT ON COLUMN service_performances.service_start_date IS '용역시작일';
COMMENT ON COLUMN service_performances.service_end_date IS '용역완료일';
COMMENT ON COLUMN service_performances.share_rate IS '지분율(%)';
COMMENT ON COLUMN service_performances.service_amount_million IS '용역금액(백만원)';
COMMENT ON COLUMN service_performances.score IS '평점';
COMMENT ON COLUMN service_performances.evaluation_end_date IS '평가종료일';
COMMENT ON COLUMN service_performances.created_at IS '등록일시';
COMMENT ON COLUMN service_performances.created_id IS '등록자';
COMMENT ON COLUMN service_performances.last_changed_at IS '수정일시';
COMMENT ON COLUMN service_performances.last_changed_id IS '수정자';

