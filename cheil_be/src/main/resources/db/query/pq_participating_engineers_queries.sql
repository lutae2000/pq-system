/*
  PQ 참여 기술자 관리 API 구현 참고 SQL

  참고:
  - 백엔드에서는 projectHistoryConditions JSON을 파싱하여 조건별 EXISTS 절을 동적으로 조립한다.
  - SQL 문자열 결합 전 operator, logicalOperator 허용 목록을 검증한다.
  - value, valueTo, code 값은 반드시 bind parameter로 전달한다.
*/

/* 후보 기술자 기본 조회 */
SELECT
  pem.engr_id AS engr_id,
  pem.name_kor AS name,
  pem.dept_name AS department,
  pem.duty_part AS position,
  pem.duty_part AS job_field,
  pem.pro_part AS specialty_field,
  pem.design_grade AS design_grade,
  pem.construction_management_grade AS construction_management_grade,
  pem.retire_yn AS retire_yn
FROM pq_engineer_master pem
WHERE 1 = 1
  AND (:keyword IS NULL OR pem.name_kor LIKE '%' || :keyword || '%' OR pem.dept_name LIKE '%' || :keyword || '%' OR pem.duty_part LIKE '%' || :keyword || '%')
  AND (:retire_yn IS NULL OR pem.retire_yn = :retire_yn)
  AND (:job_field IS NULL OR pem.duty_part = :job_field)
  AND (:specialty_field IS NULL OR pem.pro_part = :specialty_field)
  AND (:design_grade IS NULL OR pem.design_grade = :design_grade)
  AND (:construction_management_grade IS NULL OR pem.construction_management_grade = :construction_management_grade)
  AND NOT EXISTS (
    SELECT 1
    FROM pq_find_engr_info selected
    WHERE selected.bid_seq = :bid_seq
      AND selected.work_duty_id = :work_duty_id
      AND selected.engr_id = pem.engr_id
  )
ORDER BY pem.name_kor, pem.engr_id;

/* 공종 조건 EXISTS 예시 */
EXISTS (
  SELECT 1
  FROM pq_engineer_project_history eph
  JOIN company_performance_construction_kinds kind
    ON kind.seq = eph.seq
  WHERE eph.engr_id = pem.engr_id
    AND kind.level1_code = :level1_code
    AND (:level2_code IS NULL OR kind.level2_code = :level2_code)
    AND (:level3_code IS NULL OR kind.level3_code = :level3_code)
);

/* 일반 조건 EXISTS 예시: 용역명 포함 */
EXISTS (
  SELECT 1
  FROM pq_engineer_project_history eph
  JOIN company_performances cp
    ON cp.seq = eph.seq
  WHERE eph.engr_id = pem.engr_id
    AND cp.job_name LIKE '%' || :value || '%'
);

/* 일반 조건 EXISTS 예시: 계약 종료일 이후 */
EXISTS (
  SELECT 1
  FROM pq_engineer_project_history eph
  JOIN company_performances cp
    ON cp.seq = eph.seq
  WHERE eph.engr_id = pem.engr_id
    AND cp.contract_to_date >= :value
);

/* 상세 조건 EXISTS 예시: 프로젝트 연장 1000m 이상 */
EXISTS (
  SELECT 1
  FROM pq_engineer_project_history eph
  JOIN company_performance_outlines outline
    ON outline.seq = eph.seq
  WHERE eph.engr_id = pem.engr_id
    AND outline.category_code = :outline_category_code
    AND outline.subcategory_code = :outline_subcategory_code
    AND TO_NUMBER(NULLIF(REGEXP_REPLACE(outline.outline_content, '[^0-9.-]', ''), '')) >= :value
);

/* 상세 조건 EXISTS 예시: 숫자 범위 */
EXISTS (
  SELECT 1
  FROM pq_engineer_project_history eph
  JOIN company_performance_outlines outline
    ON outline.seq = eph.seq
  WHERE eph.engr_id = pem.engr_id
    AND outline.category_code = :outline_category_code
    AND outline.subcategory_code = :outline_subcategory_code
    AND TO_NUMBER(NULLIF(REGEXP_REPLACE(outline.outline_content, '[^0-9.-]', ''), '')) BETWEEN :value AND :value_to
);

/* 선정 기술자 조회 */
SELECT
  selected.bid_seq,
  selected.work_duty_id,
  selected.engr_id,
  pem.name_kor AS name,
  pem.dept_name AS department,
  pem.duty_part AS position,
  pem.duty_part AS job_field,
  pem.pro_part AS specialty_field,
  pem.retire_yn AS retire_yn
FROM pq_find_engr_info selected
JOIN pq_engineer_master pem
  ON pem.engr_id = selected.engr_id
WHERE selected.bid_seq = :bid_seq
  AND (:work_duty_id IS NULL OR selected.work_duty_id = :work_duty_id)
ORDER BY pem.name_kor, selected.engr_id;

/* 등록 */
INSERT INTO pq_find_engr_info (
  bid_seq,
  work_duty_id,
  engr_id
) VALUES (
  :bid_seq,
  :work_duty_id,
  :engr_id
);

/* 삭제 */
DELETE FROM pq_find_engr_info
WHERE bid_seq = :bid_seq
  AND work_duty_id = :work_duty_id
  AND engr_id = :engr_id;

/* 일괄 반영: 기존 선정 삭제 후 요청 engineers 배열을 반복 insert */
DELETE FROM pq_find_engr_info
WHERE bid_seq = :bid_seq
  AND work_duty_id = :work_duty_id;

