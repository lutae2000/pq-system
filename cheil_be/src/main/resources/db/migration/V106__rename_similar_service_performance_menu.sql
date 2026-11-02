UPDATE system_menus
SET menu_name = '건설사업 실적 관리',
    menu_path = '/pq/construction-project-performances',
    description = '건설사업 실적 관리 화면',
    last_changed_at = CURRENT_TIMESTAMP
WHERE menu_code = 'pq-similar-service-performances';
