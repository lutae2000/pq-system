-- 용역구분은 공통코드 ST 2레벨로 통합되었으므로 기존 테이블과 관리 메뉴를 제거한다.
UPDATE common_codes
SET ref_value1 = '{"table":"company_performances","column":"job_type","valueType":"code","optionSource":{"type":"commonCodeLevel2","level1Code":"ST"}}',
    last_changed_at = CURRENT_TIMESTAMP,
    last_changed_id = 'migration'
WHERE level1_code = 'PQCT'
  AND level2_code = 'C0109'
  AND level3_code = 'C1';

UPDATE system_menus
SET use_yn = FALSE,
    visible_yn = FALSE,
    last_changed_at = CURRENT_TIMESTAMP,
    last_changed_id = 'migration'
WHERE menu_code = 'service-types';

DROP TABLE IF EXISTS service_types;
