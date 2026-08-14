INSERT INTO system_policies (policy_key, policy_name, policy_value, value_type, sort_seq, use_yn, description)
VALUES
    ('SESSION_TIMEOUT_MINUTES', 'Session timeout minutes', '240', 'NUMBER', 110, TRUE, 'Absolute login session timeout in minutes'),
    ('IDLE_TIMEOUT_MINUTES', 'Idle timeout minutes', '60', 'NUMBER', 120, TRUE, 'Automatic logout timeout after no mouse or keyboard activity')
ON CONFLICT (policy_key) DO UPDATE
SET policy_value = CASE
        WHEN system_policies.policy_key = 'SESSION_TIMEOUT_MINUTES' AND system_policies.policy_value = '480' THEN '240'
        WHEN system_policies.policy_key = 'IDLE_TIMEOUT_MINUTES' AND system_policies.policy_value = '30' THEN '60'
        ELSE system_policies.policy_value
    END,
    policy_name = EXCLUDED.policy_name,
    value_type = EXCLUDED.value_type,
    sort_seq = EXCLUDED.sort_seq,
    description = EXCLUDED.description;
