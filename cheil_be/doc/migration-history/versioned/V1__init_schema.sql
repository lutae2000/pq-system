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

INSERT INTO auth_users
(login_id, employee_no, user_name, user_password, use_yn, group_code, dept_code, login_dt, recent_ip_addr, pic_yn, wrong_password_count, email, created_at, created_id, last_changed_at, last_changed_id, password_reset_dt, password_reset)
VALUES('admin', 'F0001', '관리자', '$2a$12$LvivJmEbkgXdtQYVxvHcQebKuMJFevJeIGOs8EkJ9Jpd0J6PjURXq', true, 'ADMIN', '0', '2026-11-13 15:36:52.783', '127.0.0.1', false, 0, '', '2026-11-13 15:36:53.091', 'system', '2026-11-13 15:36:53.091', 'system', '20261006', false);


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
    notice_type VARCHAR(40) NOT NULL DEFAULT 'SY',
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
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('user-management', '사용자 관리', 'system-root', '/system/user-management', 'PAGE', 110, true, true, '사용자 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('system-management', '시스템 관리', 'system-root', '/system/system-management', 'PAGE', 120, true, true, '시스템 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('system-policy-management', '시스템정책 관리', 'system-root', '/system/policies', 'PAGE', 130, true, true, '시스템 정책 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('menu-management', '메뉴 관리', 'system-root', '/system/menus', 'PAGE', 140, true, true, '메뉴 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('role-permission-management', '역할권한 관리', 'system-root', '/system/roles', 'PAGE', 150, true, true, '역할 권한 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('notice-management', '공지사항 관리', 'system-root', '/system/notices', 'PAGE', 160, true, true, '공지사항 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('bid-results', '입찰결과 관리', 'bid-management', '/bid/bid-results', 'PAGE', 0, true, true, '입찰결과 관리', '2026-08-04 07:40:34.699', 'admin', '2026-08-04 07:40:34.699', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('client-codes', '발주처 관리', 'code-root', '/code/clients', 'PAGE', 240, true, true, '거래처 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('certificates', '자격증관리', 'code-root', '/code/certifications', 'PAGE', 250, true, true, '자격증 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('construction-types', '공사종류 관리', 'code-root', '/code/construction-types', 'PAGE', 270, true, true, '공종구분 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('education-reminder-completion-management', '이수 관리', 'education-reminders-root', '/education-reminders/completions', 'PAGE', 380, true, true, '교육 이수 관리 화면', '2026-08-12 11:00:43.084', NULL, '2026-08-12 11:00:43.084', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('common-code', '공통코드 관리', 'code-root', '/code/common-codes', 'PAGE', 230, true, true, '공통코드 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('company-performance', '회사 실적 관리', 'pq-management', '/pq/company-performance', 'PAGE', 2, true, true, '회사 실적 관리', '2026-07-16 04:35:08.850', 'admin', '2026-07-16 04:35:08.850', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('headquarters-profile', '본사정보 관리', 'code-root', '/code/headquarters', 'PAGE', 220, true, true, '본사 정보 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('new_employment', '신규 고용률 관리', 'document-management', '/pq/new-employment-rates', 'PAGE', 5, true, true, '신규 고용률 관리', '2026-07-28 07:12:18.101', 'admin', '2026-07-28 07:12:18.101', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('work-overlap-contracts', '계약 관리', 'work-overlap', '/work-overlap/contracts', 'PAGE', 0, true, true, '업무중복도 계약관리', '2026-08-03 09:00:35.816', 'admin', '2026-08-06 01:18:33.884', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('construction-project-performances', '건설사업 실적 관리', 'document-management', '/pq/construction-project-performances', 'PAGE', 3, true, true, '건설사업 실적 관리', '2026-07-29 05:34:46.596', 'admin', '2026-11-02 15:53:25.262', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('pq-new-technology-developments', '개발실적', 'new-technology', '/pq/new-technology-developments', 'PAGE', 345, true, true, '신기술 개발실적 관리 화면', '2026-07-23 13:56:46.397', 'admin', '2026-07-23 15:42:01.807', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('pq-new-technology-usages', '활용실적', 'new-technology', '/pq/new-technology-usages', 'PAGE', 346, true, true, '신기술 활용실적 관리 화면', '2026-07-23 15:43:06.045', NULL, '2026-07-23 16:00:55.955', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('pq-new-technology-investments', '투자실적', 'new-technology', '/pq/new-technology-investments', 'PAGE', 347, true, true, '신기술 투자실적 관리 화면', '2026-07-23 16:25:21.419', NULL, '2026-07-23 16:29:10.926', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('engineer-personal-info', '기술인 인사정보', 'pq-management', '/pq/engineers/profile', 'PAGE', 1, true, true, '기술인 인사정보 관리', '2026-07-13 04:50:19.462', 'admin', '2026-07-13 04:50:19.462', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('bid-notice', '공고문', 'pq-management', '/pq/bid-notice', 'PAGE', 0, true, true, 'PQ 공고문 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('education-reminder-send-history', '교육알림 발송 이력', 'education-reminders-root', '/education-reminders/send-history', 'PAGE', 381, true, true, '교육알림 발송 이력 조회 화면', '2026-08-18 13:55:15.489', NULL, '2026-08-18 13:55:15.489', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('education-reminder-management', '기초 정보 관리', 'education-reminders-root', '/education-reminders', 'PAGE', 370, true, true, '교육 알림 기초 정보 및 템플릿 관리 화면', '2026-08-12 10:50:02.902', NULL, '2026-08-21 13:52:42.856', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('department', '부서 관리', 'system-root', '/system/departments', 'PAGE', 260, true, true, '부서 관리 화면', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('work-overlap-engineer-list', '기술인 조회', 'work-overlap', '/work-overlap/engineers', 'PAGE', 1, true, true, '기술인 조회', '2026-08-06 02:01:33.973', 'admin', '2026-08-06 02:01:33.973', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('qualification-criteria', '적격 심사 기준 관리', 'bid-management', '/bid/qualification-criteria', 'PAGE', 0, true, true, '적격 심사 기준 관리', '2026-08-04 07:40:34.699', 'admin', '2026-08-04 07:40:34.699', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('pq-participating-engineers', 'PQ참여 기술인 관리', 'document-management', '/pq/documents/pq-participating-engineers', 'PAGE', 0, true, true, 'PQ기술인 관리', '2026-07-21 08:03:49.960', 'admin', '2026-07-21 08:03:49.960', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('work-overlap-docs', '문서 생성', 'work-overlap', '/work-overlap/work-overlap-docs', 'PAGE', 2, true, true, '업무중복도 문서 생성', '2026-09-09 00:46:33.309', 'admin', '2026-09-09 00:52:18.105', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('new-technology', '신기술', NULL, NULL, 'GROUP', 6, true, true, '신기술 그룹', '2026-07-23 08:58:16.538', 'admin', '2026-07-23 08:59:40.807', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('work-overlap', '업무 중복도', NULL, NULL, 'GROUP', 4, true, true, NULL, '2026-08-03 07:36:18.699', 'admin', '2026-08-04 01:08:31.101', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('pq-management', 'PQ관리', NULL, NULL, 'GROUP', 2, true, true, 'PQ관리', '2026-07-08 08:58:39.767', 'admin', '2026-07-23 08:59:36.830', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('code-root', '기초정보', NULL, NULL, 'GROUP', 1, true, true, '기초정보', '2026-07-08 08:58:39.767', 'admin', '2026-07-23 08:58:41.692', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('pq-shinindo-management', '신인도 관리', 'document-management', '/pq/shinindo-management', 'PAGE', 6, true, true, '신인도 관리 화면', '2026-07-27 13:05:54.236', NULL, '2026-07-27 13:05:54.236', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('service-performance-management', '용역 수행 성과 관리', 'document-management', '/pq/service-performance-management', 'PAGE', 4, true, true, '용역 수행 성과 관리', '2026-07-29 05:34:46.596', 'admin', '2026-07-29 05:34:46.596', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('system-root', '시스템', NULL, NULL, 'GROUP', 0, true, true, '시스템', '2026-07-08 08:58:39.767', 'admin', '2026-07-23 08:58:38.179', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('bid-management', '입찰', '', '', 'GROUP', 7, true, true, '입찰', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('education-reminders-root', '교육', NULL, NULL, 'GROUP', 5, true, true, '교육 알림 관리 메뉴', '2026-08-12 10:50:02.902', NULL, '2026-08-21 13:52:42.856', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('document-management', '문서관리', '', '', 'GROUP', 3, true, true, '문서관리', '2026-07-08 08:58:39.767', NULL, '2026-07-08 08:58:39.767', NULL);
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('engineer-performance-docs', '기술인 실적문서 생성', 'document-management', '/pq/documents/engineer-performance-docs', 'PAGE', 1, true, true, '기술인 실적문서 생성', '2026-07-22 01:05:27.390', 'admin', '2026-07-22 01:05:27.390', 'admin');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('company-performance-docs', '회사 실적문서 생성', 'document-management', '/pq/documents/company-performance-docs', 'PAGE', 2, true, true, '회사 실적문서 생성', '2026-09-04 04:33:18.302', 'admin11', '2026-09-04 04:33:18.302', 'admin11');
INSERT INTO system_menus
(menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description, created_at, created_id, last_changed_at, last_changed_id)
VALUES('g2b-bid-notice', '공고문(나라장터)', 'pq-management', '/pq/g2b-bid-notice-candidates', 'PAGE', 0, true, true, '공고문(나라장터)', '2026-10-12 17:15:33.227', 'admin', '2026-10-12 17:15:33.227', 'admin');

INSERT INTO system_policies
(policy_key, created_at, created_id, last_changed_at, last_changed_id, description, policy_name, policy_value, sort_seq, use_yn, value_type)
VALUES('API_AUDIT_LOG_RETENTION_DAYS', '2026-08-27 14:58:26.860', 'admin', '2026-08-27 14:58:26.860', 'admin', '설정한 기간이 지난 API 감사 로그를 삭제합니다.', 'API 감사 로그 삭제 주기', '180', 20, false, 'NUMBER');
INSERT INTO system_policies
(policy_key, created_at, created_id, last_changed_at, last_changed_id, description, policy_name, policy_value, sort_seq, use_yn, value_type)
VALUES('PASSWORD_CHANGE_PERIOD_DAYS', '2026-08-27 14:58:27.472', 'admin', '2026-08-27 14:58:27.472', 'admin', '설정한 일수가 지나면 비밀번호 변경을 요구합니다.', '비밀번호 변경 주기', '90', 30, false, 'NUMBER');
INSERT INTO system_policies
(policy_key, created_at, created_id, last_changed_at, last_changed_id, description, policy_name, policy_value, sort_seq, use_yn, value_type)
VALUES('PASSWORD_FAILURE_LIMIT', '2026-08-27 14:58:27.957', 'admin', '2026-08-27 14:58:27.957', 'admin', '연속 로그인 실패가 설정 횟수에 도달하면 로그인을 제한합니다.', '로그인 실패 횟수 제한', '5', 40, false, 'NUMBER');
INSERT INTO system_policies
(policy_key, created_at, created_id, last_changed_at, last_changed_id, description, policy_name, policy_value, sort_seq, use_yn, value_type)
VALUES('INACTIVE_LOGIN_LIMIT_DAYS', '2026-08-26 15:24:16.164', 'admin11', '2026-08-27 14:58:28.378', 'admin', '설정한 기간 동안 접속하지 않은 계정의 로그인을 제한합니다.', '장기 미접속 시 로그인 제한', '90', 50, false, 'NUMBER');
INSERT INTO system_policies
(policy_key, created_at, created_id, last_changed_at, last_changed_id, description, policy_name, policy_value, sort_seq, use_yn, value_type)
VALUES('BRANDING_LOGIN_BACKGROUND_URL', '2026-09-16 09:07:25.744', 'admin', '2026-09-16 09:11:01.925', 'admin', '로그인 화면에 표시할 배경 이미지입니다.', '로그인 배경 이미지', '/login/login-light-hero-balanced-v2.png', 200, true, 'TEXT');
INSERT INTO system_policies
(policy_key, created_at, created_id, last_changed_at, last_changed_id, description, policy_name, policy_value, sort_seq, use_yn, value_type)
VALUES('SINGLE_SESSION_LIMIT_ENABLED', '2026-08-26 16:13:11.370', 'admin', '2026-11-02 15:02:25.707', 'admin', '사용자 계정의 동시 로그인을 한 개 세션으로 제한합니다.', '단일 세션 제한 여부', 'true', 10, false, 'BOOLEAN');
INSERT INTO system_policies
(policy_key, created_at, created_id, last_changed_at, last_changed_id, description, policy_name, policy_value, sort_seq, use_yn, value_type)
VALUES('G2B_BID_NOTICE_RETENTION_MONTHS', NULL, NULL, NULL, NULL, '최초 수집일로부터 지정한 개월수가 지난 나라장터 용역 공고 후보와 동기화 이력을 삭제합니다.', '나라장터 용역의 오래된 공고 삭제', '3', 60, true, 'NUMBER');

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
COMMENT ON COLUMN system_notices.notice_type IS '공지 유형 공통코드';
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
