-- Convert user-owned records to the auth_users primary key while retaining login_id for authentication.
ALTER TABLE user_menu_permissions DROP CONSTRAINT fk_user_menu_permissions_user;
ALTER TABLE user_menu_permissions ADD COLUMN employee_no VARCHAR(20);
UPDATE user_menu_permissions permission
SET employee_no = account.employee_no
FROM auth_users account
WHERE permission.login_id = account.login_id;
ALTER TABLE user_menu_permissions DROP CONSTRAINT user_menu_permissions_pkey;
ALTER TABLE user_menu_permissions DROP COLUMN login_id;
ALTER TABLE user_menu_permissions ALTER COLUMN employee_no SET NOT NULL;
ALTER TABLE user_menu_permissions ADD CONSTRAINT user_menu_permissions_pkey PRIMARY KEY (employee_no, menu_code);
ALTER TABLE user_menu_permissions ADD CONSTRAINT fk_user_menu_permissions_user
    FOREIGN KEY (employee_no) REFERENCES auth_users (employee_no) ON DELETE CASCADE;

ALTER TABLE notification_preferences ADD COLUMN employee_no VARCHAR(20);
UPDATE notification_preferences preference
SET employee_no = account.employee_no
FROM auth_users account
WHERE preference.login_id = account.login_id;
-- Stop on orphaned rows so existing settings are not discarded silently.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM notification_preferences WHERE employee_no IS NULL) THEN
        RAISE EXCEPTION 'notification_preferences contains login IDs without matching auth_users';
    END IF;
END $$;
ALTER TABLE notification_preferences
    DROP CONSTRAINT IF EXISTS notification_preferences_pkey,
    DROP CONSTRAINT IF EXISTS system_notification_preferences_pkey;
ALTER TABLE notification_preferences DROP COLUMN login_id;
ALTER TABLE notification_preferences ALTER COLUMN employee_no SET NOT NULL;
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (employee_no, menu_path);
ALTER TABLE notification_preferences ADD CONSTRAINT fk_notification_preferences_user
    FOREIGN KEY (employee_no) REFERENCES auth_users (employee_no) ON DELETE CASCADE;

-- A shared value may identify different users in the two key spaces.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM (
            SELECT work_duty_id FROM work_overlap_document_engineers
            UNION ALL
            SELECT work_duty_id FROM work_overlap_document_targets
            UNION ALL
            SELECT work_duty_id FROM pq_find_engr_info
        ) AS duty
        JOIN auth_users login_owner ON login_owner.login_id = duty.work_duty_id
        JOIN auth_users employee_owner ON employee_owner.employee_no = duty.work_duty_id
        WHERE login_owner.employee_no <> employee_owner.employee_no
    ) THEN
        RAISE EXCEPTION 'PQ work_duty_id matches the login ID and employee number of different users';
    END IF;
END $$;

ALTER TABLE work_overlap_document_engineers
    DROP CONSTRAINT IF EXISTS work_overlap_document_engineers_work_duty_id_fkey;
UPDATE work_overlap_document_engineers engineer
SET work_duty_id = account.employee_no
FROM auth_users account
WHERE engineer.work_duty_id = account.login_id;
ALTER TABLE work_overlap_document_engineers
    ADD CONSTRAINT work_overlap_document_engineers_work_duty_id_fkey
        FOREIGN KEY (work_duty_id) REFERENCES auth_users (employee_no) ON DELETE CASCADE;

UPDATE work_overlap_document_targets target
SET work_duty_id = account.employee_no
FROM auth_users account
WHERE target.work_duty_id = account.login_id;

UPDATE pq_find_engr_info engineer
SET work_duty_id = account.employee_no
FROM auth_users account
WHERE engineer.work_duty_id = account.login_id;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM work_overlap_document_targets target
        WHERE NOT EXISTS (SELECT 1 FROM auth_users account WHERE account.employee_no = target.work_duty_id)
    ) OR EXISTS (
        SELECT 1 FROM pq_find_engr_info engineer
        WHERE NOT EXISTS (SELECT 1 FROM auth_users account WHERE account.employee_no = engineer.work_duty_id)
    ) THEN
        RAISE EXCEPTION 'PQ work_duty_id contains values without matching auth_users.employee_no';
    END IF;
END $$;

UPDATE department department_row
SET input_duty_id = account.employee_no
FROM auth_users account
WHERE department_row.input_duty_id = account.login_id;
UPDATE department department_row
SET chg_duty_id = account.employee_no
FROM auth_users account
WHERE department_row.chg_duty_id = account.login_id;

UPDATE g2b_bid_notice_candidates candidate
SET imported_by = account.employee_no
FROM auth_users account
WHERE candidate.imported_by = account.login_id;

COMMENT ON COLUMN user_menu_permissions.employee_no IS '사용자 사번';
COMMENT ON COLUMN notification_preferences.employee_no IS '알림 설정 사용자 사번';
COMMENT ON COLUMN work_overlap_document_engineers.work_duty_id IS '업무 담당자 사번(auth_users.employee_no)';
COMMENT ON COLUMN work_overlap_document_targets.work_duty_id IS '업무중복도 문서 작업자 사번(auth_users.employee_no)';
COMMENT ON COLUMN pq_find_engr_info.work_duty_id IS 'PQ 작업자 사번(auth_users.employee_no)';

CREATE OR REPLACE FUNCTION fn_user_menu_permissions(p_login_id VARCHAR)
RETURNS TABLE (
    menu_code VARCHAR, menu_name VARCHAR, parent_menu_code VARCHAR,
    menu_path VARCHAR, menu_type VARCHAR, sort_seq INTEGER,
    use_yn BOOLEAN, visible_yn BOOLEAN, read_yn BOOLEAN,
    create_yn BOOLEAN, update_yn BOOLEAN, delete_yn BOOLEAN
)
LANGUAGE sql STABLE AS $$
SELECT m.menu_code, m.menu_name, m.parent_menu_code, m.menu_path,
       m.menu_type, m.sort_seq, m.use_yn, m.visible_yn,
       COALESCE(rp.read_yn, false) OR COALESCE(up.read_yn, false),
       COALESCE(rp.create_yn, false) OR COALESCE(up.create_yn, false),
       COALESCE(rp.update_yn, false) OR COALESCE(up.update_yn, false),
       COALESCE(rp.delete_yn, false) OR COALESCE(up.delete_yn, false)
FROM auth_users au
CROSS JOIN system_menus m
LEFT JOIN role_permissions rp ON rp.menu_code = m.menu_code AND rp.role_code = au.group_code
LEFT JOIN user_menu_permissions up ON up.menu_code = m.menu_code AND up.employee_no = au.employee_no
WHERE au.login_id = p_login_id AND m.use_yn = true AND m.visible_yn = true AND au.use_yn = true
ORDER BY m.sort_seq, m.menu_code
$$;
