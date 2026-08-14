CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO department (
    dept_code,
    dept_name,
    dept_div,
    proj_div,
    use_yn,
    terminate_date,
    headquater_code,
    input_duty_id,
    input_date,
    chg_duty_id,
    chg_date,
    sort_seq,
    mh_yn,
    cost_dept
)
VALUES
    ('0', 'Common Department', '1', '30', TRUE, '2999-12-31', '0', 'system', CURRENT_TIMESTAMP, NULL, NULL, '9999', FALSE, '0'),
    ('DSR000', 'Road Department', '1', '20', TRUE, '2999-12-31', 'DSR000', 'system', CURRENT_TIMESTAMP, NULL, NULL, '1', FALSE, 'DSR000')
ON CONFLICT (dept_code) DO UPDATE
SET
    dept_name = EXCLUDED.dept_name,
    dept_div = EXCLUDED.dept_div,
    proj_div = EXCLUDED.proj_div,
    use_yn = EXCLUDED.use_yn,
    terminate_date = EXCLUDED.terminate_date,
    headquater_code = EXCLUDED.headquater_code,
    input_duty_id = EXCLUDED.input_duty_id,
    input_date = EXCLUDED.input_date,
    chg_duty_id = EXCLUDED.chg_duty_id,
    chg_date = EXCLUDED.chg_date,
    sort_seq = EXCLUDED.sort_seq,
    mh_yn = EXCLUDED.mh_yn,
    cost_dept = EXCLUDED.cost_dept;

INSERT INTO auth_roles (role_code, role_name, use_yn, description, sort_seq)
VALUES
    ('100', 'Default User', TRUE, 'Default user role', 1),
    ('ADMIN', 'System Administrator', TRUE, 'Full access role', 0)
ON CONFLICT (role_code) DO UPDATE
SET
    role_name = EXCLUDED.role_name,
    use_yn = EXCLUDED.use_yn,
    description = EXCLUDED.description,
    sort_seq = EXCLUDED.sort_seq;

INSERT INTO auth_users (
    employee_no,
    user_name,
    login_id,
    user_password,
    use_yn,
    group_code,
    dept_code,
    login_dt,
    recent_ip_addr,
    pic_yn,
    wrong_password_count,
    email,
    created_at,
    created_id,
    last_changed_at,
    last_changed_id
)
VALUES
    ('F0001', 'Administrator', 'admin', crypt('0', gen_salt('bf', 12)), TRUE, 'ADMIN', '0', NULL, '127.0.0.1', FALSE, 0, NULL, DEFAULT, 'system', DEFAULT, 'system')
ON CONFLICT (login_id) DO UPDATE
SET
    user_name = EXCLUDED.user_name,
    use_yn = EXCLUDED.use_yn,
    group_code = EXCLUDED.group_code,
    dept_code = EXCLUDED.dept_code,
    last_changed_at = CURRENT_TIMESTAMP,
    last_changed_id = 'system';

INSERT INTO role_permissions (role_code, menu_code, read_yn, create_yn, update_yn, delete_yn)
SELECT 'ADMIN', menu_code, TRUE, TRUE, TRUE, TRUE
FROM system_menus
ON CONFLICT (role_code, menu_code) DO UPDATE
SET
    read_yn = EXCLUDED.read_yn,
    create_yn = EXCLUDED.create_yn,
    update_yn = EXCLUDED.update_yn,
    delete_yn = EXCLUDED.delete_yn;
