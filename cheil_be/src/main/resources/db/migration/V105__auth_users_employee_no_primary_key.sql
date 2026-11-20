-- Keep login_id unique for authentication and existing foreign keys.
DO $$
DECLARE
    had_work_duty_fk BOOLEAN;
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'auth_users'::regclass
          AND contype = 'p'
          AND pg_get_constraintdef(oid) = 'PRIMARY KEY (employee_no)'
    ) THEN
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'work_overlap_document_engineers'::regclass
          AND conname = 'work_overlap_document_engineers_work_duty_id_fkey'
    ) INTO had_work_duty_fk;

    ALTER TABLE user_menu_permissions
        DROP CONSTRAINT fk_user_menu_permissions_user;

    ALTER TABLE work_overlap_document_engineers
        DROP CONSTRAINT IF EXISTS work_overlap_document_engineers_work_duty_id_fkey;

    ALTER TABLE auth_users
        DROP CONSTRAINT auth_users_pkey,
        DROP CONSTRAINT auth_users_employee_no_key,
        ADD CONSTRAINT auth_users_pkey PRIMARY KEY (employee_no),
        ADD CONSTRAINT uq_auth_users_login_id UNIQUE (login_id);

    ALTER TABLE user_menu_permissions
        ADD CONSTRAINT fk_user_menu_permissions_user
            FOREIGN KEY (login_id) REFERENCES auth_users (login_id) ON DELETE CASCADE;

    IF had_work_duty_fk THEN
        ALTER TABLE work_overlap_document_engineers
            ADD CONSTRAINT work_overlap_document_engineers_work_duty_id_fkey
                FOREIGN KEY (work_duty_id) REFERENCES auth_users (login_id) ON DELETE CASCADE;
    END IF;
END $$;
