-- General project-history conditions use an allowlisted optionSource definition.
-- The backend resolves these definitions through the common-code/service-type ports;
-- ref_value1 never contains executable SQL.
UPDATE common_codes
SET ref_value1 = CASE level2_code
    WHEN 'C0102' THEN '{"table":"company_performances","column":"client_kind","valueType":"code","optionSource":{"type":"commonCode","level1Code":"PQ","level2Code":"EA"}}'
    WHEN 'C0103' THEN '{"table":"company_performances","column":"business_type","valueType":"code","optionSource":{"type":"commonCode","level1Code":"PQ","level2Code":"CA"}}'
    WHEN 'C0109' THEN '{"table":"company_performances","column":"job_type","valueType":"code","optionSource":{"type":"serviceType"}}'
    WHEN 'C0130' THEN '{"table":"company_performances","column":"job_finish_yn","valueType":"code","optionSource":{"type":"commonCode","level1Code":"PQ","level2Code":"BA"}}'
    WHEN 'C0140' THEN '{"table":"pq_engineer_project_history","column":"joinyn","valueType":"code","optionSource":{"type":"staticYn","labels":{"Y":"참여","N":"미참여"}}}'
    WHEN 'C0141' THEN '{"table":"pq_engineer_project_history","column":"returnyn","valueType":"code","optionSource":{"type":"staticYn","labels":{"Y":"신고","N":"미신고"}}}'
    WHEN 'C0150' THEN '{"table":"company_performances","column":"job_own_yn","valueType":"code","optionSource":{"type":"staticYn","labels":{"Y":"자사","N":"타사"}}}'
    WHEN 'C0160' THEN '{"table":"pq_engineer_project_history","column":"jobpart","valueType":"code","optionSource":{"type":"commonCode","level1Code":"PQ","level2Code":"DA"}}'
END,
last_changed_at = CURRENT_TIMESTAMP,
last_changed_id = 'migration'
WHERE level1_code = 'PQCT'
  AND level3_code = 'C1'
  AND level2_code IN ('C0102', 'C0103', 'C0109', 'C0130', 'C0140', 'C0141', 'C0150', 'C0160');
