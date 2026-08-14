UPDATE system_policies
SET use_yn = FALSE,
    description = 'Session timeout is configured by application environment properties.'
WHERE policy_key IN ('SESSION_TIMEOUT_MINUTES', 'IDLE_TIMEOUT_MINUTES');
