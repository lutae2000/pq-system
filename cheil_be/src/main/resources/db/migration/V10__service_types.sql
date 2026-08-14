CREATE TABLE IF NOT EXISTS service_types (
    service_type_code VARCHAR(20) PRIMARY KEY,
    service_type_name VARCHAR(200) NOT NULL,
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

COMMENT ON TABLE service_types IS '용역 코드';
COMMENT ON COLUMN service_types.service_type_code IS '용역코드';
COMMENT ON COLUMN service_types.service_type_name IS '용역 이름';
COMMENT ON COLUMN service_types.use_yn IS '사용여부';

CREATE INDEX IF NOT EXISTS idx_service_types_name ON service_types (service_type_name);

INSERT INTO service_types (
    service_type_code,
    service_type_name,
    use_yn,
    created_at,
    created_id,
    last_changed_at,
    last_changed_id
)
VALUES
    ('r', '검측감리', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('1', '타당성조사', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('2', '기본계획', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('3', '기본설계', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('4', '실시설계', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('5', '감리', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('6', '시공', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('7', '감독', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('8', '기본및실시설계', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('9', '설계감리', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('b', '유지관리', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('a', '기술자문', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('c', '기술진단', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('e', '영향평가', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('f', '종합계획', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('g', '연구', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('h', '사업관리', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('i', '학술용역', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('j', '인허가', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('k', '사후환경영향조사', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('l', '사전환경성검토', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('m', '사전재해영향성검토', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('o', '환경성검토', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('p', '측량', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('q', '지구단위계획', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('A', '지하안전영향평가', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('s', '사후평가', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('B', '교통안전진단', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('t', '조사', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('x', '정밀점검', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('w', '정밀안전진단', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'),
    ('y', '성능평가', TRUE, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system')
ON CONFLICT (service_type_code) DO UPDATE
SET
    service_type_name = EXCLUDED.service_type_name,
    use_yn = EXCLUDED.use_yn,
    last_changed_at = CURRENT_TIMESTAMP,
    last_changed_id = 'system';

-- Menu seed for pq-service-types is defined in V1__init_schema.sql.
