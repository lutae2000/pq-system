DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_system_policies_value_type'
    ) THEN
        ALTER TABLE system_policies
            ADD CONSTRAINT ck_system_policies_value_type
            CHECK (value_type IN ('BOOLEAN', 'NUMBER', 'TEXT'));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_system_policies_active_value'
    ) THEN
        ALTER TABLE system_policies
            ADD CONSTRAINT ck_system_policies_active_value
            CHECK (NOT use_yn OR LENGTH(BTRIM(policy_value)) > 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_system_policies_number_value'
    ) THEN
        ALTER TABLE system_policies
            ADD CONSTRAINT ck_system_policies_number_value
            CHECK (value_type <> 'NUMBER' OR policy_value ~ '^[0-9]{1,3}$');
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_system_policies_sort
    ON system_policies (sort_seq, policy_key);

CREATE INDEX IF NOT EXISTS idx_system_policies_use
    ON system_policies (use_yn);
