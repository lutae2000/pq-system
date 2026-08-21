CREATE TABLE IF NOT EXISTS new_technology_developments (
    id BIGSERIAL PRIMARY KEY,
    sequence_label VARCHAR(50),
    title VARCHAR(500) NOT NULL,
    technology_type VARCHAR(20),
    applicant_count NUMERIC(10, 2),
    application_date VARCHAR(8),
    target_field VARCHAR(100),
    application_no VARCHAR(100),
    registration_no VARCHAR(100),
    valid_until VARCHAR(8),
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    calculated_score NUMERIC(10, 2),
    summary TEXT,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT ck_new_technology_applicant_count
        CHECK (applicant_count IS NULL OR applicant_count > 0),
    CONSTRAINT ck_new_technology_type
        CHECK (technology_type IS NULL OR technology_type IN ('신기술', '특허', '신안')),
    CONSTRAINT ck_new_technology_application_date
        CHECK (application_date IS NULL OR application_date ~ '^[0-9]{8}$'),
    CONSTRAINT ck_new_technology_valid_until
        CHECK (valid_until IS NULL OR valid_until ~ '^[0-9]{8}$'),
    CONSTRAINT ck_new_technology_developments_calculated_score
        CHECK (calculated_score IS NULL OR calculated_score >= 0)
);

CREATE INDEX IF NOT EXISTS ix_new_technology_developments_title
    ON new_technology_developments (title);
CREATE INDEX IF NOT EXISTS ix_new_technology_developments_technology_type
    ON new_technology_developments (technology_type);
CREATE INDEX IF NOT EXISTS ix_new_technology_developments_application_date
    ON new_technology_developments (application_date);
CREATE INDEX IF NOT EXISTS ix_new_technology_developments_target_field
    ON new_technology_developments (target_field);
CREATE INDEX IF NOT EXISTS ix_new_technology_developments_registration_no
    ON new_technology_developments (registration_no);

COMMENT ON TABLE new_technology_developments IS '신기술 개발실적';
COMMENT ON COLUMN new_technology_developments.id IS '신기술 개발실적 ID';
COMMENT ON COLUMN new_technology_developments.sequence_label IS '엑셀 연번';
COMMENT ON COLUMN new_technology_developments.title IS '출원명';
COMMENT ON COLUMN new_technology_developments.technology_type IS '구분';
COMMENT ON COLUMN new_technology_developments.applicant_count IS '출원인수';
COMMENT ON COLUMN new_technology_developments.application_date IS '출원일';
COMMENT ON COLUMN new_technology_developments.target_field IS '적용대상';
COMMENT ON COLUMN new_technology_developments.application_no IS '출원번호';
COMMENT ON COLUMN new_technology_developments.registration_no IS '등록번호';
COMMENT ON COLUMN new_technology_developments.valid_until IS '유효기간';
COMMENT ON COLUMN new_technology_developments.summary IS '내용';
COMMENT ON COLUMN new_technology_developments.remark IS '비고';
COMMENT ON COLUMN new_technology_developments.created_at IS '작성일시';
COMMENT ON COLUMN new_technology_developments.created_id IS '작성자';
COMMENT ON COLUMN new_technology_developments.last_changed_at IS '수정일시';
COMMENT ON COLUMN new_technology_developments.last_changed_id IS '수정자';

INSERT INTO system_menus (
    menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description
)
VALUES (
    'pq-new-technology-developments',
    '신기술 개발실적',
    'pq-management',
    '/pq/new-technology-developments',
    'PAGE',
    345,
    TRUE,
    TRUE,
    '신기술 개발실적 관리 화면'
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
SELECT role_code, 'pq-new-technology-developments', TRUE, TRUE, TRUE, TRUE
FROM auth_roles
WHERE role_code = 'ADMIN'
ON CONFLICT (role_code, menu_code) DO NOTHING;
