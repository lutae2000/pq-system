-- 초기 스키마 생성을 위해 기존 테이블을 정리한다.
-- CASCADE 옵션으로 종속된 외래 키도 함께 제거한 후 테이블을 다시 생성한다.
DROP TABLE IF EXISTS user_menu_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS system_notices CASCADE;
DROP TABLE IF EXISTS system_policies CASCADE;
DROP TABLE IF EXISTS system_menus CASCADE;
DROP TABLE IF EXISTS auth_roles CASCADE;
DROP TABLE IF EXISTS department CASCADE;
DROP TABLE IF EXISTS auth_users CASCADE;
DROP TABLE IF EXISTS api_call_logs CASCADE;

-- 장애 추적 및 모니터링에 사용하는 API 요청·응답 감사 로그.
CREATE TABLE api_call_logs (
    id BIGSERIAL PRIMARY KEY,
    request_id UUID NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    http_method VARCHAR(16) NOT NULL,
    request_uri TEXT NOT NULL,
    query_string TEXT,
    handler TEXT,
    service_id VARCHAR(100),
    client_ip VARCHAR(64),
    request_payload TEXT,
    response_payload TEXT,
    status_code INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    duration_millis BIGINT NOT NULL,
    login_id VARCHAR(100),
    program_code VARCHAR(100),
    trace_id VARCHAR(32)
);


-- API 로그 검색 및 트레이스 연계를 위한 인덱스.
CREATE INDEX idx_api_call_logs_occurred_at
    ON api_call_logs (occurred_at);

CREATE INDEX idx_api_call_logs_service_id
    ON api_call_logs (service_id);

CREATE INDEX idx_api_call_logs_trace_id
    ON api_call_logs (trace_id);

-- 애플리케이션 사용자 및 인증 정보.
CREATE TABLE auth_users (
    login_id VARCHAR(100) PRIMARY KEY,
    employee_no VARCHAR(20) NOT NULL UNIQUE,
    user_name VARCHAR(100) NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    use_yn BOOLEAN NOT NULL,
    group_code VARCHAR(20) NOT NULL,
    dept_code VARCHAR(20) NOT NULL,
    login_dt TIMESTAMP,
    recent_ip_addr VARCHAR(64),
    password_reset_dt VARCHAR(8),
    password_reset BOOLEAN NOT NULL DEFAULT FALSE,
    pic_yn BOOLEAN NOT NULL,
    wrong_password_count INTEGER NOT NULL DEFAULT 0,
    email VARCHAR(255),
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);


-- 사용자와 업무 화면에서 사용하는 조직 부서 정보.
CREATE TABLE department (
    dept_code VARCHAR(20) PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    dept_div VARCHAR(10) NOT NULL,
    proj_div VARCHAR(10) NOT NULL,
    use_yn BOOLEAN NOT NULL,
    terminate_date DATE,
    headquater_code VARCHAR(20) NOT NULL,
    input_duty_id VARCHAR(20),
    input_date TIMESTAMP,
    chg_duty_id VARCHAR(20),
    chg_date TIMESTAMP,
    sort_seq VARCHAR(10) NOT NULL,
    mh_yn BOOLEAN NOT NULL,
    cost_dept VARCHAR(20)
);


CREATE INDEX idx_department_headquater_code ON department (headquater_code);

-- 권한 검사에 사용하는 역할 정보.
CREATE TABLE auth_roles (
    role_code VARCHAR(50) PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(500),
    sort_seq INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);


-- 시스템 메뉴 및 화면 정보.
-- 감사 시간 컬럼은 NULL을 허용하며, 값을 생략하면 현재 시간이 자동 입력된다.
CREATE TABLE system_menus (
    menu_code VARCHAR(50) PRIMARY KEY,
    menu_name VARCHAR(100) NOT NULL,
    parent_menu_code VARCHAR(50),
    menu_path VARCHAR(255),
    menu_type VARCHAR(20) NOT NULL DEFAULT 'PAGE',
    sort_seq INTEGER NOT NULL DEFAULT 0,
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    visible_yn BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(500),
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);


-- 사용자에게 표시되는 시스템 공지사항.
CREATE TABLE system_notices (
    notice_id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    exposure_start_at TIMESTAMP NOT NULL,
    exposure_end_at TIMESTAMP NOT NULL,
    publish_at TIMESTAMP NOT NULL,
    important BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    target_path VARCHAR(500),
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);


-- 애플리케이션 공통 정책 및 정책 값.
CREATE TABLE system_policies (
    policy_key VARCHAR(100) PRIMARY KEY,
    policy_name VARCHAR(150) NOT NULL,
    policy_value VARCHAR(500) NOT NULL,
    value_type VARCHAR(20) NOT NULL,
    sort_seq INTEGER NOT NULL DEFAULT 0,
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(500),
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT ck_system_policies_value_type
        CHECK (value_type IN ('BOOLEAN', 'NUMBER', 'TEXT')),
    CONSTRAINT ck_system_policies_active_value
        CHECK (NOT use_yn OR LENGTH(BTRIM(policy_value)) > 0),
    CONSTRAINT ck_system_policies_number_value
        CHECK (value_type <> 'NUMBER' OR policy_value ~ '^[0-9]{1,3}$')
);


-- 역할별 시스템 메뉴 권한.
CREATE TABLE role_permissions (
    role_code VARCHAR(50) NOT NULL,
    menu_code VARCHAR(50) NOT NULL,
    read_yn BOOLEAN NOT NULL DEFAULT FALSE,
    create_yn BOOLEAN NOT NULL DEFAULT FALSE,
    update_yn BOOLEAN NOT NULL DEFAULT FALSE,
    delete_yn BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100) NOT NULL DEFAULT 'system',
    last_changed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100) NOT NULL DEFAULT 'system',
    PRIMARY KEY (role_code, menu_code),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_code) REFERENCES auth_roles (role_code) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_menu
        FOREIGN KEY (menu_code) REFERENCES system_menus (menu_code) ON DELETE CASCADE
);


-- 사용자별 시스템 메뉴 권한.
CREATE TABLE user_menu_permissions (
    login_id VARCHAR(100) NOT NULL,
    menu_code VARCHAR(50) NOT NULL,
    read_yn BOOLEAN NOT NULL DEFAULT FALSE,
    create_yn BOOLEAN NOT NULL DEFAULT FALSE,
    update_yn BOOLEAN NOT NULL DEFAULT FALSE,
    delete_yn BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (login_id, menu_code),
    CONSTRAINT fk_user_menu_permissions_user
        FOREIGN KEY (login_id) REFERENCES auth_users (login_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_menu_permissions_menu
        FOREIGN KEY (menu_code) REFERENCES system_menus (menu_code) ON DELETE CASCADE
);


-- 스키마 문서화를 위한 PostgreSQL 테이블 코멘트.
COMMENT ON TABLE api_call_logs IS 'API 요청 및 응답 감사 로그';
COMMENT ON TABLE auth_users IS '애플리케이션 사용자 및 인증 정보';
COMMENT ON TABLE department IS '조직 부서 기준 정보';
COMMENT ON TABLE auth_roles IS '애플리케이션 권한 역할';
COMMENT ON TABLE system_menus IS '시스템 메뉴 및 화면 정보';
COMMENT ON TABLE system_notices IS '사용자에게 표시되는 시스템 공지사항';
COMMENT ON TABLE system_policies IS '애플리케이션 공통 정책 설정';
COMMENT ON TABLE role_permissions IS '역할별 시스템 메뉴 권한';
COMMENT ON TABLE user_menu_permissions IS '사용자별 시스템 메뉴 권한';


-- 초기 애플리케이션 실행에 필요한 기본 역할.
INSERT INTO auth_roles (role_code, role_name, use_yn, description, sort_seq)
VALUES
    ('100', 'Basic User', TRUE, 'Basic role', 1),
    ('ADMIN', 'System Admin', TRUE, 'Full permission role', 0)
ON CONFLICT (role_code) DO NOTHING;

-- 초기 시스템 메뉴 계층.
INSERT INTO system_menus (menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description)
VALUES
    ('system-root', '시스템 관리', NULL, NULL, 'GROUP', 100, TRUE, TRUE, '시스템 관리 메뉴'),
    ('user-management', '사용자 관리', 'system-root', '/system/user-management', 'PAGE', 110, TRUE, TRUE, '사용자 관리 화면'),
    ('system-management', '시스템 관리', 'system-root', '/system/system-management', 'PAGE', 120, TRUE, TRUE, '시스템 관리 화면'),
    ('system-policy-management', '시스템정책 관리', 'system-root', '/system/policies', 'PAGE', 130, TRUE, TRUE, '시스템 정책 관리 화면'),
    ('menu-management', '메뉴 관리', 'system-root', '/system/menus', 'PAGE', 140, TRUE, TRUE, '메뉴 관리 화면'),
    ('role-permission-management', '역할권한 관리', 'system-root', '/system/roles', 'PAGE', 150, TRUE, TRUE, '역할 권한 관리 화면'),
    ('notice-management', '공지사항 관리', 'system-root', '/system/notices', 'PAGE', 160, TRUE, TRUE, '공지사항 관리 화면'),
    ('code-root', '기초정보관리', NULL, NULL, 'GROUP', 200, TRUE, TRUE, '공통 기초정보 관리 메뉴'),
    ('business-place', '사업장코드 등록', 'code-root', '/code/business-places', 'PAGE', 210, TRUE, TRUE, '사업장 코드 관리 화면'),
    ('headquarters-profile', '본사정보관리', 'code-root', '/code/headquarters', 'PAGE', 220, TRUE, TRUE, '본사 정보 관리 화면'),
    ('common-code', '공통코드(수주)', 'code-root', '/code/common-codes', 'PAGE', 230, TRUE, TRUE, '수주 공통코드 관리 화면'),
    ('client-codes', '거래처 등록', 'code-root', '/code/clients', 'PAGE', 240, TRUE, TRUE, '거래처 관리 화면'),
    ('certificates', '자격증관리', 'code-root', '/code/certifications', 'PAGE', 250, TRUE, TRUE, '자격증 관리 화면'),
    ('department', '부서관리', 'code-root', '/code/departments', 'PAGE', 260, TRUE, TRUE, '부서 관리 화면'),
    ('construction-types', '공종구분 관리', 'code-root', '/code/construction-types', 'PAGE', 270, TRUE, TRUE, '공종구분 관리 화면'),
    ('service-types', '용역구분 관리', 'code-root', '/code/service-types', 'PAGE', 280, TRUE, TRUE, '용역구분 관리 화면'),
    ('pq-management', 'PQ관리', NULL, NULL, 'GROUP', 300, TRUE, TRUE, 'PQ 업무 관리 메뉴'),
    ('pq-announcements', '공고문', 'pq-management', '/pq/announcements', 'PAGE', 310, TRUE, TRUE, 'PQ 공고문 관리 화면')
ON CONFLICT (menu_code) DO NOTHING;

-- 기본 보안 및 세션 정책.
INSERT INTO system_policies (policy_key, policy_name, policy_value, value_type, sort_seq, use_yn, description)
VALUES
    ('PASSWORD_CHANGE_PERIOD_DAYS', 'Password Change Period Days', '90', 'NUMBER', 10, TRUE, 'Recommended password change period'),
    ('PASSWORD_FAILURE_LIMIT', 'Password Failure Limit', '5', 'NUMBER', 20, TRUE, 'Allowed consecutive password failures'),
    ('ACCOUNT_LOCK_MINUTES', 'Account Lock Minutes', '30', 'NUMBER', 30, TRUE, 'Account lock duration after password failures'),
    ('PASSWORD_MIN_LENGTH', 'Password Minimum Length', '8', 'NUMBER', 40, TRUE, 'Minimum password length'),
    ('PASSWORD_HISTORY_COUNT', 'Password History Count', '5', 'NUMBER', 50, TRUE, 'Disallowed previous password count'),
    ('PASSWORD_REQUIRE_UPPERCASE', 'Require Uppercase', 'true', 'BOOLEAN', 60, TRUE, 'Whether password requires uppercase letters'),
    ('PASSWORD_REQUIRE_LOWERCASE', 'Require Lowercase', 'true', 'BOOLEAN', 70, TRUE, 'Whether password requires lowercase letters'),
    ('PASSWORD_REQUIRE_NUMBER', 'Require Number', 'true', 'BOOLEAN', 80, TRUE, 'Whether password requires numbers'),
    ('PASSWORD_REQUIRE_SPECIAL', 'Require Special Character', 'true', 'BOOLEAN', 90, TRUE, 'Whether password requires special characters'),
    ('INITIAL_PASSWORD_CHANGE_REQUIRED', 'Initial Password Change Required', 'true', 'BOOLEAN', 100, TRUE, 'Whether password change is required on first login'),
    ('SESSION_TIMEOUT_MINUTES', 'Session Timeout Minutes', '480', 'NUMBER', 110, TRUE, 'Login session timeout minutes'),
    ('IDLE_TIMEOUT_MINUTES', 'Idle Timeout Minutes', '30', 'NUMBER', 120, TRUE, 'Idle logout timeout minutes'),
    ('MAX_CONCURRENT_SESSIONS', 'Max Concurrent Sessions', '1', 'NUMBER', 130, TRUE, 'Allowed concurrent sessions per account')
ON CONFLICT (policy_key) DO NOTHING;

-- ADMIN 역할에 초기 메뉴 전체 권한을 부여한다.
INSERT INTO role_permissions (role_code, menu_code, read_yn, create_yn, update_yn, delete_yn)
SELECT
    'ADMIN',
    menu_code,
    TRUE,
    TRUE,
    TRUE,
    TRUE
FROM system_menus
ON CONFLICT (role_code, menu_code) DO NOTHING;

COMMENT ON COLUMN api_call_logs.occurred_at IS 'API 호출 발생 시각';
COMMENT ON COLUMN api_call_logs.request_uri IS '요청 URI';
COMMENT ON COLUMN api_call_logs.query_string IS '요청 쿼리 문자열';
COMMENT ON COLUMN api_call_logs.handler IS '처리 핸들러';
COMMENT ON COLUMN api_call_logs.request_payload IS '요청 본문';
COMMENT ON COLUMN api_call_logs.response_payload IS '응답 본문';
COMMENT ON COLUMN api_call_logs.status_code IS 'HTTP 상태 코드';
COMMENT ON COLUMN api_call_logs.success IS '성공 여부';
COMMENT ON COLUMN api_call_logs.error_message IS '오류 메시지';
COMMENT ON COLUMN api_call_logs.duration_millis IS '처리 시간(밀리초)';
COMMENT ON COLUMN api_call_logs.login_id IS '로그인 ID';
COMMENT ON COLUMN api_call_logs.program_code IS '프로그램 코드';
COMMENT ON COLUMN api_call_logs.trace_id IS '추적 ID';
COMMENT ON COLUMN auth_users.use_yn IS '사용 여부';
COMMENT ON COLUMN auth_users.login_dt IS '최근 로그인 일시';
COMMENT ON COLUMN auth_users.password_reset IS '비밀번호 초기화 여부';
COMMENT ON COLUMN auth_users.pic_yn IS '담당자 여부';
COMMENT ON COLUMN auth_users.wrong_password_count IS '비밀번호 오류 횟수';
COMMENT ON COLUMN department.use_yn IS '사용 여부';
COMMENT ON COLUMN department.terminate_date IS '종료일';
COMMENT ON COLUMN department.input_date IS '입력일';
COMMENT ON COLUMN department.chg_date IS '변경일';
COMMENT ON COLUMN department.mh_yn IS '본사 여부';
COMMENT ON COLUMN auth_roles.use_yn IS '사용 여부';
COMMENT ON COLUMN auth_roles.sort_seq IS '정렬 순서';
COMMENT ON COLUMN system_menus.sort_seq IS '정렬 순서';
COMMENT ON COLUMN system_menus.use_yn IS '사용 여부';
COMMENT ON COLUMN system_menus.visible_yn IS '노출 여부';
COMMENT ON COLUMN system_notices.content IS '공지 내용';
COMMENT ON COLUMN system_notices.exposure_start_at IS '노출 시작 시각';
COMMENT ON COLUMN system_notices.exposure_end_at IS '노출 종료 시각';
COMMENT ON COLUMN system_notices.publish_at IS '게시 시각';
COMMENT ON COLUMN system_notices.important IS '중요 공지 여부';
COMMENT ON COLUMN system_notices.active IS '활성 여부';
COMMENT ON COLUMN system_notices.target_path IS '공지 클릭 이동 경로';
COMMENT ON COLUMN system_policies.sort_seq IS '정렬 순서';
COMMENT ON COLUMN system_policies.use_yn IS '사용 여부';
COMMENT ON COLUMN role_permissions.read_yn IS '조회 권한';
COMMENT ON COLUMN role_permissions.create_yn IS '생성 권한';
COMMENT ON COLUMN role_permissions.update_yn IS '수정 권한';
COMMENT ON COLUMN role_permissions.delete_yn IS '삭제 권한';
COMMENT ON COLUMN user_menu_permissions.read_yn IS '조회 권한';
COMMENT ON COLUMN user_menu_permissions.create_yn IS '생성 권한';
COMMENT ON COLUMN user_menu_permissions.update_yn IS '수정 권한';
COMMENT ON COLUMN user_menu_permissions.delete_yn IS '삭제 권한';
COMMENT ON COLUMN auth_users.created_at IS '생성 시각';
COMMENT ON COLUMN auth_users.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN auth_roles.created_at IS '생성 시각';
COMMENT ON COLUMN auth_roles.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN system_menus.created_at IS '생성 시각';
COMMENT ON COLUMN system_menus.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN system_notices.created_at IS '생성 시각';
COMMENT ON COLUMN system_notices.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN system_policies.created_at IS '생성 시각';
COMMENT ON COLUMN system_policies.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN role_permissions.created_at IS '생성 시각';
COMMENT ON COLUMN role_permissions.last_changed_at IS '최종 변경 시각';
