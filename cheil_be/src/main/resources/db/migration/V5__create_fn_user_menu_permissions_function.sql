CREATE OR REPLACE FUNCTION fn_user_menu_permissions(
    p_login_id VARCHAR
)
RETURNS TABLE (
    menu_code VARCHAR,
    menu_name VARCHAR,
    parent_menu_code VARCHAR,
    menu_path VARCHAR,
    menu_type VARCHAR,
    sort_seq INTEGER,
    use_yn BOOLEAN,
    visible_yn BOOLEAN,
    read_yn BOOLEAN,
    create_yn BOOLEAN,
    update_yn BOOLEAN,
    delete_yn BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
SELECT
    m.menu_code,
    m.menu_name,
    m.parent_menu_code,
    m.menu_path,
    m.menu_type,
    m.sort_seq,
    m.use_yn,
    m.visible_yn,
    COALESCE(rp.read_yn, false) OR COALESCE(up.read_yn, false) AS read_yn,
    COALESCE(rp.create_yn, false) OR COALESCE(up.create_yn, false) AS create_yn,
    COALESCE(rp.update_yn, false) OR COALESCE(up.update_yn, false) AS update_yn,
    COALESCE(rp.delete_yn, false) OR COALESCE(up.delete_yn, false) AS delete_yn
FROM auth_users au
         CROSS JOIN system_menus m
         LEFT JOIN role_permissions rp
                   ON rp.menu_code = m.menu_code
                       AND rp.role_code = au.group_code
         LEFT JOIN user_menu_permissions up
                   ON up.menu_code = m.menu_code
                       AND up.login_id = au.login_id
WHERE au.login_id = p_login_id
  AND m.use_yn = true
  AND m.visible_yn = true
  and AU.use_yn = true
ORDER BY m.sort_seq, m.menu_code
    $$;
