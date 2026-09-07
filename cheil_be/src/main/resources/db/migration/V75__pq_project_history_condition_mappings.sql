-- Store PQ related project-history condition metadata in common_codes.ref_value1.
-- The backend validates table/column against information_schema before using
-- them as SQL identifiers.

UPDATE common_codes
SET ref_value1 = CASE level2_code
    WHEN 'C0101' THEN '{"table":"company_performances","column":"job_name","valueType":"text"}'
    WHEN 'C0102' THEN '{"table":"company_performances","column":"client_kind","valueType":"text"}'
    WHEN 'C0104' THEN '{"table":"company_performances","column":"contract_from_date","valueType":"date"}'
    WHEN 'C0105' THEN '{"table":"company_performances","column":"contract_to_date","valueType":"date"}'
    WHEN 'C0107' THEN '{"table":"company_performances","column":"contract_amt","valueType":"number"}'
    WHEN 'C0108' THEN '{"table":"company_performances","column":"job_type","valueType":"code"}'
    WHEN 'C0110' THEN '{"table":"company_performances","column":"business_type","valueType":"code"}'
    WHEN 'C0120' THEN '{"table":"pq_engineer_project_history","column":"startdt","valueType":"date"}'
    WHEN 'C0121' THEN '{"table":"company_performances","column":"summary","valueType":"text"}'
    WHEN 'C0130' THEN '{"table":"company_performances","column":"job_finish_yn","valueType":"code"}'
    WHEN 'C0140' THEN '{"table":"pq_engineer_project_history","column":"joinyn","valueType":"code"}'
    WHEN 'C0141' THEN '{"table":"pq_engineer_project_history","column":"returnyn","valueType":"code"}'
    WHEN 'C0150' THEN '{"table":"pq_engineer_project_history","column":"compname","valueType":"text"}'
    WHEN 'C0160' THEN '{"table":"pq_engineer_project_history","column":"jobpart","valueType":"text"}'
END,
last_changed_at = CURRENT_TIMESTAMP,
last_changed_id = 'migration'
WHERE level1_code = 'PQCT'
  AND level3_code = 'C1'
  AND level2_code IN (
      'C0101', 'C0102', 'C0104', 'C0105', 'C0107', 'C0108', 'C0110',
      'C0120', 'C0121', 'C0130', 'C0140', 'C0141', 'C0150', 'C0160'
  );
