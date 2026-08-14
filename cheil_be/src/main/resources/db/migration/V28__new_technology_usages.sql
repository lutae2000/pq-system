CREATE TABLE IF NOT EXISTS new_technology_usages (
    id BIGSERIAL PRIMARY KEY,
    designation_no VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    developers TEXT,
    project_name TEXT,
    client VARCHAR(300),
    notice_date VARCHAR(8),
    usage_expiration_date VARCHAR(8),
    usage_count INTEGER,
    amount_thousand NUMERIC(18, 2),
    score NUMERIC(10, 2),
    summary TEXT,
    disaster_prevention_score NUMERIC(10, 2),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT ck_new_technology_usages_count
        CHECK (usage_count IS NULL OR usage_count >= 0),
    CONSTRAINT ck_new_technology_usages_amount
        CHECK (amount_thousand IS NULL OR amount_thousand >= 0),
    CONSTRAINT ck_new_technology_usages_score
        CHECK (score IS NULL OR score >= 0),
    CONSTRAINT ck_new_technology_usages_disaster_score
        CHECK (disaster_prevention_score IS NULL OR disaster_prevention_score >= 0),
    CONSTRAINT ck_new_technology_usages_notice_date
        CHECK (notice_date IS NULL OR notice_date ~ '^[0-9]{8}$'),
    CONSTRAINT ck_new_technology_usages_usage_expiration_date
        CHECK (usage_expiration_date IS NULL OR usage_expiration_date ~ '^[0-9]{8}$')
);

CREATE INDEX IF NOT EXISTS ix_new_technology_usages_designation_no
    ON new_technology_usages (designation_no);
CREATE INDEX IF NOT EXISTS ix_new_technology_usages_title
    ON new_technology_usages (title);
CREATE INDEX IF NOT EXISTS ix_new_technology_usages_client
    ON new_technology_usages (client);
CREATE INDEX IF NOT EXISTS ix_new_technology_usages_notice_date
    ON new_technology_usages (notice_date);

COMMENT ON TABLE new_technology_usages IS '신기술 활용실적';
COMMENT ON COLUMN new_technology_usages.id IS '신기술 활용실적 ID';
COMMENT ON COLUMN new_technology_usages.designation_no IS '지정번호';
COMMENT ON COLUMN new_technology_usages.title IS '건명';
COMMENT ON COLUMN new_technology_usages.developers IS '개발자';
COMMENT ON COLUMN new_technology_usages.project_name IS '공사명';
COMMENT ON COLUMN new_technology_usages.client IS '발주처';
COMMENT ON COLUMN new_technology_usages.notice_date IS '고시일';
COMMENT ON COLUMN new_technology_usages.usage_expiration_date IS '활용 만료일';
COMMENT ON COLUMN new_technology_usages.usage_count IS '건수';
COMMENT ON COLUMN new_technology_usages.amount_thousand IS '금액(천원)';
COMMENT ON COLUMN new_technology_usages.score IS '점수';
COMMENT ON COLUMN new_technology_usages.summary IS '내용';
COMMENT ON COLUMN new_technology_usages.disaster_prevention_score IS '방재 점수';
COMMENT ON COLUMN new_technology_usages.remark IS '비고';
COMMENT ON COLUMN new_technology_usages.created_at IS '작성일시';
COMMENT ON COLUMN new_technology_usages.created_id IS '작성자';
COMMENT ON COLUMN new_technology_usages.last_changed_at IS '수정일시';
COMMENT ON COLUMN new_technology_usages.last_changed_id IS '수정자';

INSERT INTO system_menus (
    menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description
)
VALUES (
    'pq-new-technology-usages',
    '신기술 활용실적',
    'pq-management',
    '/pq/new-technology-usages',
    'PAGE',
    346,
    TRUE,
    TRUE,
    '신기술 활용실적 관리 화면'
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
SELECT role_code, 'pq-new-technology-usages', TRUE, TRUE, TRUE, TRUE
FROM auth_roles
WHERE role_code = 'ADMIN'
ON CONFLICT (role_code, menu_code) DO NOTHING;
