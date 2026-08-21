CREATE TABLE IF NOT EXISTS education_reminder_basic_infos (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    description TEXT,
    cycle_unit VARCHAR(20) NOT NULL,
    cycle_value INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT ck_education_reminder_basic_infos_cycle_unit CHECK (cycle_unit IN ('MONTH', 'YEAR')),
    CONSTRAINT ck_education_reminder_basic_infos_cycle_value CHECK (cycle_value > 0)
);

CREATE INDEX IF NOT EXISTS ix_education_reminder_basic_infos_name
    ON education_reminder_basic_infos (name);
CREATE INDEX IF NOT EXISTS ix_education_reminder_basic_infos_active
    ON education_reminder_basic_infos (active);

CREATE TABLE IF NOT EXISTS education_management (
    id BIGSERIAL PRIMARY KEY,
    engr_id VARCHAR(20) NOT NULL,
    education_code VARCHAR(50) NOT NULL,
    education_start_date_1 VARCHAR(8),
    education_start_date_2 VARCHAR(8),
    education_registered BOOLEAN NOT NULL DEFAULT FALSE,
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT uq_education_management_engineer_code UNIQUE (engr_id, education_code),
    CONSTRAINT fk_education_management_engineer
        FOREIGN KEY (engr_id) REFERENCES pq_engineer_master (engr_id) ON DELETE CASCADE,
    CONSTRAINT fk_education_management_basic_info
        FOREIGN KEY (education_code) REFERENCES education_reminder_basic_infos (code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_education_management_education_code
    ON education_management (education_code);

COMMENT ON TABLE education_management IS '교육 이수 관리';
COMMENT ON COLUMN education_management.id IS '교육 이수 관리 ID';
COMMENT ON COLUMN education_management.engr_id IS '기술인 ID';
COMMENT ON COLUMN education_management.education_code IS '교육 코드';
COMMENT ON COLUMN education_management.education_start_date_1 IS '최근 교육 시작일 1';
COMMENT ON COLUMN education_management.education_start_date_2 IS '최근 교육 시작일 2';
COMMENT ON COLUMN education_management.education_registered IS '교육 신청 여부';
COMMENT ON COLUMN education_management.remark IS '비고';

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
    homepage_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT ck_education_reminder_templates_channel CHECK (channel IN ('LMS', 'SMS', 'KAKAO'))
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

CREATE TABLE IF NOT EXISTS education_reminder_phone_numbers (
    engr_id VARCHAR(20) PRIMARY KEY,
    phone_no VARCHAR(50) NOT NULL,
    CONSTRAINT fk_education_reminder_phone_numbers_engineer
        FOREIGN KEY (engr_id) REFERENCES pq_engineer_master (engr_id) ON DELETE CASCADE
);

COMMENT ON TABLE education_reminder_phone_numbers IS '교육 알림 발송 전화번호';
COMMENT ON COLUMN education_reminder_phone_numbers.engr_id IS '기술인 ID';
COMMENT ON COLUMN education_reminder_phone_numbers.phone_no IS '전화번호';

CREATE TABLE IF NOT EXISTS education_reminder_basic_info_engineers (
    basic_info_code VARCHAR(50) NOT NULL,
    engineer_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT pk_education_reminder_basic_info_engineers PRIMARY KEY (basic_info_code, engineer_id),
    CONSTRAINT fk_education_reminder_basic_info_engineers_basic_info_code
        FOREIGN KEY (basic_info_code) REFERENCES education_reminder_basic_infos (code) ON DELETE CASCADE,
    CONSTRAINT fk_education_reminder_basic_info_engineers_engineer
        FOREIGN KEY (engineer_id) REFERENCES pq_engineer_master (engr_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_education_reminder_basic_info_engineers_engineer_id
    ON education_reminder_basic_info_engineers (engineer_id);

COMMENT ON TABLE education_reminder_basic_info_engineers IS '교육 알림 기초정보별 할당 기술인';
COMMENT ON COLUMN education_reminder_basic_info_engineers.basic_info_code IS '교육 알림 기초정보 코드';
COMMENT ON COLUMN education_reminder_basic_info_engineers.engineer_id IS '기술인 ID';

CREATE TABLE IF NOT EXISTS education_reminder_send_batches (
    id BIGSERIAL PRIMARY KEY,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    requested_by VARCHAR(100) NOT NULL,
    template_id BIGINT NOT NULL,
    template_name VARCHAR(300) NOT NULL,
    channel VARCHAR(10) NOT NULL,
    is_test_send BOOLEAN NOT NULL DEFAULT FALSE,
    test_phone_no VARCHAR(50),
    target_count INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    fail_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    preview_message TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS education_reminder_send_logs (
    id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL,
    target_row_key VARCHAR(100) NOT NULL,
    engineer_id VARCHAR(20) NOT NULL,
    engineer_name VARCHAR(100) NOT NULL,
    department_name VARCHAR(100),
    target_phone_no VARCHAR(50),
    actual_phone_no VARCHAR(50) NOT NULL,
    channel VARCHAR(10) NOT NULL,
    template_id BIGINT NOT NULL,
    template_name VARCHAR(300) NOT NULL,
    message_content TEXT NOT NULL,
    is_test_send BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    failure_reason TEXT,
    request_payload TEXT,
    response_payload TEXT,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_education_reminder_send_logs_batch
        FOREIGN KEY (batch_id) REFERENCES education_reminder_send_batches (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_education_reminder_send_batches_requested_at
    ON education_reminder_send_batches (requested_at DESC);
CREATE INDEX IF NOT EXISTS ix_education_reminder_send_logs_batch_id
    ON education_reminder_send_logs (batch_id);
CREATE INDEX IF NOT EXISTS ix_education_reminder_send_logs_requested_at
    ON education_reminder_send_logs (requested_at DESC);
CREATE INDEX IF NOT EXISTS ix_education_reminder_send_logs_status
    ON education_reminder_send_logs (status);

COMMENT ON TABLE education_reminder_send_batches IS '교육 알림 발송 배치';
COMMENT ON TABLE education_reminder_send_logs IS '교육 알림 발송 이력';
COMMENT ON COLUMN education_reminder_send_batches.template_id IS '템플릿 ID';
COMMENT ON COLUMN education_reminder_send_batches.channel IS '발송 채널';
COMMENT ON COLUMN education_reminder_send_batches.status IS '발송 상태';
COMMENT ON COLUMN education_reminder_send_logs.batch_id IS '발송 배치 ID';
COMMENT ON COLUMN education_reminder_send_logs.engineer_id IS '기술인 ID';
COMMENT ON COLUMN education_reminder_send_logs.actual_phone_no IS '실제 발송 전화번호';
COMMENT ON COLUMN education_reminder_send_logs.status IS '발송 상태';

INSERT INTO system_menus (
    menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description
)
VALUES (
    'education-reminder-send-history', '교육 알림 발송 이력', 'education-reminders-root',
    '/education-reminders/send-history', 'PAGE', 381, TRUE, TRUE, '교육 알림 발송 이력 조회 화면'
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
SELECT role_code, 'education-reminder-send-history', TRUE, TRUE, FALSE, FALSE
FROM auth_roles
WHERE role_code = 'ADMIN'
ON CONFLICT (role_code, menu_code) DO NOTHING;
