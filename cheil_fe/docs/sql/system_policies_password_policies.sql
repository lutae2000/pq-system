-- 비밀번호 변경 주기 정책: 일 단위, 최대 3자리
INSERT INTO system_policies (
    policy_key, policy_name, policy_value, value_type, sort_seq, use_yn, description
)
VALUES (
    'PASSWORD_CHANGE_PERIOD_DAYS',
    '비밀번호 변경 주기',
    '90',
    'NUMBER',
    30,
    TRUE,
    '설정한 일수가 지나면 비밀번호 변경을 요구합니다.'
)
ON CONFLICT (policy_key) DO UPDATE
SET policy_name = EXCLUDED.policy_name,
    policy_value = EXCLUDED.policy_value,
    value_type = EXCLUDED.value_type,
    sort_seq = EXCLUDED.sort_seq,
    use_yn = EXCLUDED.use_yn,
    description = EXCLUDED.description;

-- 로그인 실패 횟수 제한 정책: 회 단위, 최대 3자리
INSERT INTO system_policies (
    policy_key, policy_name, policy_value, value_type, sort_seq, use_yn, description
)
VALUES (
    'PASSWORD_FAILURE_LIMIT',
    '로그인 실패 횟수 제한',
    '5',
    'NUMBER',
    40,
    TRUE,
    '연속 로그인 실패가 설정 횟수에 도달하면 로그인을 제한합니다.'
)
ON CONFLICT (policy_key) DO UPDATE
SET policy_name = EXCLUDED.policy_name,
    policy_value = EXCLUDED.policy_value,
    value_type = EXCLUDED.value_type,
    sort_seq = EXCLUDED.sort_seq,
    use_yn = EXCLUDED.use_yn,
    description = EXCLUDED.description;
