ALTER TABLE IF EXISTS common_departments RENAME TO department;

ALTER INDEX IF EXISTS idx_common_departments_headquater_code RENAME TO idx_department_headquater_code;

INSERT INTO system_menus (
    menu_code,
    menu_name,
    parent_menu_code,
    menu_path,
    menu_type,
    sort_seq,
    use_yn,
    visible_yn,
    description
)
SELECT
    'department',
    CASE
        WHEN menu_name = 'Common Department Management' THEN 'Department Management'
        WHEN menu_name = '공통부서 관리' THEN '부서 관리'
        ELSE menu_name
    END,
    parent_menu_code,
    '/system/code/department',
    menu_type,
    sort_seq,
    use_yn,
    visible_yn,
    CASE
        WHEN description = 'Common department management screen' THEN 'Department management screen'
        WHEN description = '공통부서를 관리합니다.' THEN '부서를 관리합니다.'
        ELSE description
    END
FROM system_menus
WHERE menu_code = 'common-department'
   OR menu_path = '/system/code/common-department'
ON CONFLICT (menu_code) DO UPDATE
SET
    menu_name = EXCLUDED.menu_name,
    parent_menu_code = EXCLUDED.parent_menu_code,
    menu_path = EXCLUDED.menu_path,
    menu_type = EXCLUDED.menu_type,
    sort_seq = EXCLUDED.sort_seq,
    use_yn = EXCLUDED.use_yn,
    visible_yn = EXCLUDED.visible_yn,
    description = EXCLUDED.description;

INSERT INTO role_permissions (
    role_code,
    menu_code,
    read_yn,
    create_yn,
    update_yn,
    delete_yn,
    created_at,
    created_id,
    last_changed_at,
    last_changed_id
)
SELECT
    role_code,
    'department',
    read_yn,
    create_yn,
    update_yn,
    delete_yn,
    created_at,
    created_id,
    last_changed_at,
    last_changed_id
FROM role_permissions
WHERE menu_code = 'common-department'
ON CONFLICT (role_code, menu_code) DO UPDATE
SET
    read_yn = EXCLUDED.read_yn,
    create_yn = EXCLUDED.create_yn,
    update_yn = EXCLUDED.update_yn,
    delete_yn = EXCLUDED.delete_yn,
    last_changed_at = EXCLUDED.last_changed_at,
    last_changed_id = EXCLUDED.last_changed_id;

INSERT INTO user_menu_permissions (
    login_id,
    menu_code,
    read_yn,
    create_yn,
    update_yn,
    delete_yn
)
SELECT
    login_id,
    'department',
    read_yn,
    create_yn,
    update_yn,
    delete_yn
FROM user_menu_permissions
WHERE menu_code = 'common-department'
ON CONFLICT (login_id, menu_code) DO UPDATE
SET
    read_yn = EXCLUDED.read_yn,
    create_yn = EXCLUDED.create_yn,
    update_yn = EXCLUDED.update_yn,
    delete_yn = EXCLUDED.delete_yn;

DELETE FROM role_permissions WHERE menu_code = 'common-department';
DELETE FROM user_menu_permissions WHERE menu_code = 'common-department';
DELETE FROM system_menus WHERE menu_code = 'common-department';
