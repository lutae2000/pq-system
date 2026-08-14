CREATE TABLE IF NOT EXISTS education_reminder_basic_infos (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(300) NOT NULL,
    description TEXT,
    cycle_unit VARCHAR(20) NOT NULL,
    cycle_value INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT uq_education_reminder_basic_infos_code UNIQUE (code),
    CONSTRAINT ck_education_reminder_basic_infos_cycle_unit CHECK (cycle_unit IN ('MONTH', 'YEAR')),
    CONSTRAINT ck_education_reminder_basic_infos_cycle_value CHECK (cycle_value > 0)
);

CREATE INDEX IF NOT EXISTS ix_education_reminder_basic_infos_name
    ON education_reminder_basic_infos (name);
CREATE INDEX IF NOT EXISTS ix_education_reminder_basic_infos_active
    ON education_reminder_basic_infos (active);

COMMENT ON TABLE education_reminder_basic_infos IS '교육 알림 기초 정보';
COMMENT ON COLUMN education_reminder_basic_infos.code IS '기초 정보 코드';
COMMENT ON COLUMN education_reminder_basic_infos.name IS '교육명';
COMMENT ON COLUMN education_reminder_basic_infos.description IS '설명';
COMMENT ON COLUMN education_reminder_basic_infos.cycle_unit IS '주기 단위';
COMMENT ON COLUMN education_reminder_basic_infos.cycle_value IS '주기 값';
COMMENT ON COLUMN education_reminder_basic_infos.active IS '사용 여부';

CREATE TABLE IF NOT EXISTS education_reminder_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    channel VARCHAR(10) NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT ck_education_reminder_templates_channel CHECK (channel IN ('LMS', 'SMS'))
);

CREATE INDEX IF NOT EXISTS ix_education_reminder_templates_name
    ON education_reminder_templates (name);
CREATE INDEX IF NOT EXISTS ix_education_reminder_templates_channel
    ON education_reminder_templates (channel);
CREATE INDEX IF NOT EXISTS ix_education_reminder_templates_active
    ON education_reminder_templates (active);

COMMENT ON TABLE education_reminder_templates IS '교육 알림 템플릿';
COMMENT ON COLUMN education_reminder_templates.name IS '템플릿명';
COMMENT ON COLUMN education_reminder_templates.channel IS '발송 채널';
COMMENT ON COLUMN education_reminder_templates.title IS '제목';
COMMENT ON COLUMN education_reminder_templates.description IS '설명';
COMMENT ON COLUMN education_reminder_templates.content IS '본문';
COMMENT ON COLUMN education_reminder_templates.active IS '사용 여부';

INSERT INTO education_reminder_basic_infos (
    code, name, description, cycle_unit, cycle_value, active, created_at, created_id, last_changed_at, last_changed_id
)
VALUES
    ('LAW-CM-001', '건설사업관리 계속교육', '건설사업관리 계속교육 기본 주기', 'YEAR', 1, TRUE, CURRENT_TIMESTAMP, 'migration', CURRENT_TIMESTAMP, 'migration'),
    ('LAW-DS-002', '설계시공 계속교육', '설계시공 계속교육 기본 주기', 'MONTH', 12, TRUE, CURRENT_TIMESTAMP, 'migration', CURRENT_TIMESTAMP, 'migration'),
    ('LAW-SAFE-005', '건설안전 계속교육', '건설안전 계속교육 기본 주기', 'YEAR', 1, TRUE, CURRENT_TIMESTAMP, 'migration', CURRENT_TIMESTAMP, 'migration')
ON CONFLICT (code) DO NOTHING;

INSERT INTO education_reminder_templates (
    name, channel, title, description, content, active, created_at, created_id, last_changed_at, last_changed_id
)
VALUES
    ('건설사업관리 계속교육 안내', 'LMS', '건설사업관리 계속교육 안내', '기본 안내 템플릿', '[안내] {이름}님, {교육명} 마감일이 {마감일}입니다.', TRUE, CURRENT_TIMESTAMP, 'migration', CURRENT_TIMESTAMP, 'migration'),
    ('설계시공 계속교육 임박 안내', 'LMS', '설계시공 계속교육 임박 안내', '임박 알림 템플릿', '[안내] {이름}님, {교육명} 마감까지 {남은일수}일 남았습니다.', TRUE, CURRENT_TIMESTAMP, 'migration', CURRENT_TIMESTAMP, 'migration'),
    ('기한초과 즉시 안내', 'SMS', '기한초과 즉시 안내', '기한초과 알림', '{이름}님 {교육명} 마감일이 지났습니다.', FALSE, CURRENT_TIMESTAMP, 'migration', CURRENT_TIMESTAMP, 'migration')
ON CONFLICT DO NOTHING;

INSERT INTO system_menus (
    menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description
)
VALUES
    ('education-reminders-root', '교육 알림 관리', NULL, NULL, 'GROUP', 360, TRUE, TRUE, '교육 알림 관리 메뉴'),
    ('education-reminder-management', '기초 정보 관리', 'education-reminders-root', '/education-reminders', 'PAGE', 370, TRUE, TRUE, '교육 알림 기초 정보 및 템플릿 관리 화면')
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
SELECT role_code, 'education-reminder-management', TRUE, TRUE, TRUE, TRUE
FROM auth_roles
WHERE role_code = 'ADMIN'
ON CONFLICT (role_code, menu_code) DO NOTHING;
