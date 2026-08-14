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

CREATE INDEX IF NOT EXISTS ix_similar_service_performances_service_name
    ON similar_service_performances (service_name);
CREATE INDEX IF NOT EXISTS ix_similar_service_performances_client
    ON similar_service_performances (client);
CREATE INDEX IF NOT EXISTS ix_similar_service_performances_contract_dates
    ON similar_service_performances (contract_from_date, contract_to_date);

COMMENT ON TABLE similar_service_performances IS '유사용역 수행실적 관리';
COMMENT ON COLUMN similar_service_performances.company_performance_seq IS '유사용역 수행실적 SEQ';
COMMENT ON COLUMN similar_service_performances.service_name IS '용역명';
COMMENT ON COLUMN similar_service_performances.construction_type IS '공종';
COMMENT ON COLUMN similar_service_performances.client IS '발주처';
COMMENT ON COLUMN similar_service_performances.contract_from_date IS '계약 시작일';
COMMENT ON COLUMN similar_service_performances.contract_to_date IS '계약 종료일';
COMMENT ON COLUMN similar_service_performances.construction_from_date IS '공사 시작일';
COMMENT ON COLUMN similar_service_performances.construction_to_date IS '공사 종료일';
COMMENT ON COLUMN similar_service_performances.contract_price IS '계약금액';
COMMENT ON COLUMN similar_service_performances.share_ratio IS '지분율';
COMMENT ON COLUMN similar_service_performances.weight IS '가중치';
COMMENT ON COLUMN similar_service_performances.summary IS '개요';
COMMENT ON COLUMN similar_service_performances.remark IS '비고';
COMMENT ON COLUMN similar_service_performances.created_at IS '작성일시';
COMMENT ON COLUMN similar_service_performances.created_id IS '작성자';
COMMENT ON COLUMN similar_service_performances.last_changed_at IS '수정일시';
COMMENT ON COLUMN similar_service_performances.last_changed_id IS '수정자';

INSERT INTO system_menus (
    menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description
)
VALUES (
    'pq-similar-service-performances',
    '유사용역 수행실적 관리',
    'pq-management',
    '/pq/similar-service-performances',
    'PAGE',
    348,
    TRUE,
    TRUE,
    '유사용역 수행실적 관리 화면'
)
ON CONFLICT (menu_code) DO UPDATE
SET menu_name = EXCLUDED.menu_name,
    parent_menu_code = EXCLUDED.parent_menu_code,
    menu_path = EXCLUDED.menu_path,
    menu_type = EXCLUDED.menu_type,
    sort_seq = EXCLUDED.sort_seq,
    use_yn = EXCLUDED.use_yn,
    visible_yn = EXCLUDED.visible_yn,
    description = EXCLUDED.description,
    last_changed_at = CURRENT_TIMESTAMP;

INSERT INTO role_permissions (role_code, menu_code, read_yn, create_yn, update_yn, delete_yn)
SELECT role_code, 'pq-similar-service-performances', TRUE, TRUE, TRUE, TRUE
FROM auth_roles
WHERE role_code = 'ADMIN'
ON CONFLICT (role_code, menu_code) DO NOTHING;
