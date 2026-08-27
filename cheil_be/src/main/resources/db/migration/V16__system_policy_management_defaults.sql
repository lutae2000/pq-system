INSERT INTO system_policies (policy_key, policy_name, policy_value, value_type, sort_seq, use_yn, description)
VALUES
    ('SINGLE_SESSION_LIMIT_ENABLED', '단일 세션 제한 여부', 'true', 'BOOLEAN', 10, TRUE, '사용자 계정의 동시 로그인을 한 개 세션으로 제한합니다.'),
    ('API_AUDIT_LOG_RETENTION_DAYS', 'API 감사 로그 삭제 주기', '180', 'NUMBER', 20, TRUE, '설정한 기간이 지난 API 감사 로그를 삭제합니다.'),
    ('INACTIVE_LOGIN_LIMIT_DAYS', '장기 미접속 시 로그인 제한', '90', 'NUMBER', 50, TRUE, '설정한 기간 동안 접속하지 않은 계정의 로그인을 제한합니다.')
ON CONFLICT (policy_key) DO UPDATE
SET policy_name = EXCLUDED.policy_name,
    value_type = EXCLUDED.value_type,
    description = EXCLUDED.description;

UPDATE system_policies
SET policy_name = CASE policy_key
        WHEN 'PASSWORD_CHANGE_PERIOD_DAYS' THEN '비밀번호 변경 주기'
        WHEN 'PASSWORD_FAILURE_LIMIT' THEN '로그인 실패 횟수 제한'
        ELSE policy_name
    END
WHERE policy_key IN ('PASSWORD_CHANGE_PERIOD_DAYS', 'PASSWORD_FAILURE_LIMIT');
