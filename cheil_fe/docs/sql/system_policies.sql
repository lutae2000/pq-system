-- 시스템 정책 관리 테이블
-- policy_key는 API의 policyKey와 동일한 정책 코드입니다.
CREATE TABLE IF NOT EXISTS system_policies (
    policy_key       VARCHAR(100) PRIMARY KEY,
    policy_name      VARCHAR(150) NOT NULL,
    policy_value     VARCHAR(500) NOT NULL,
    value_type       VARCHAR(20) NOT NULL,
    sort_seq         INTEGER NOT NULL DEFAULT 0,
    use_yn           BOOLEAN NOT NULL DEFAULT TRUE,
    description      VARCHAR(500),
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id       VARCHAR(100),
    last_changed_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id  VARCHAR(100),

    CONSTRAINT ck_system_policies_value_type
        CHECK (value_type IN ('BOOLEAN', 'NUMBER', 'TEXT')),
    CONSTRAINT ck_system_policies_active_value
        CHECK (NOT use_yn OR LENGTH(BTRIM(policy_value)) > 0),
    CONSTRAINT ck_system_policies_number_value
        CHECK (value_type <> 'NUMBER' OR policy_value ~ '^[0-9]{1,3}$')
);

CREATE INDEX IF NOT EXISTS idx_system_policies_sort
    ON system_policies (sort_seq, policy_key);

CREATE INDEX IF NOT EXISTS idx_system_policies_use
    ON system_policies (use_yn);

-- 화면에서 관리하는 기본 정책
INSERT INTO system_policies (
    policy_key, policy_name, policy_value, value_type, sort_seq, use_yn, description
)
VALUES
    ('SINGLE_SESSION_LIMIT_ENABLED', '단일 세션 제한 여부', 'true', 'BOOLEAN', 10, TRUE,
     '사용자 계정의 동시 로그인을 한 개 세션으로 제한합니다.'),
    ('API_AUDIT_LOG_RETENTION_DAYS', 'API 감사 로그 삭제 주기', '180', 'NUMBER', 20, TRUE,
     '설정한 기간이 지난 API 감사 로그를 삭제합니다.'),
    ('PASSWORD_CHANGE_PERIOD_DAYS', '비밀번호 변경 주기', '90', 'NUMBER', 30, TRUE,
     '설정한 일수가 지나면 비밀번호 변경을 요구합니다.'),
    ('PASSWORD_FAILURE_LIMIT', '로그인 실패 횟수 제한', '5', 'NUMBER', 40, TRUE,
     '연속 로그인 실패가 설정 횟수에 도달하면 로그인을 제한합니다.'),
    ('INACTIVE_LOGIN_LIMIT_DAYS', '장기 미접속 시 로그인 제한', '90', 'NUMBER', 50, TRUE,
     '설정한 기간 동안 접속하지 않은 계정의 로그인을 제한합니다.')
ON CONFLICT (policy_key) DO UPDATE
SET policy_name = EXCLUDED.policy_name,
    value_type = EXCLUDED.value_type,
    description = EXCLUDED.description;
