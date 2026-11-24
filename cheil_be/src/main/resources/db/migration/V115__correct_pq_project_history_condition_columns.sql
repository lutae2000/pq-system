UPDATE common_codes
SET ref_value1 = (ref_value1::jsonb || '{"column":"own_amt","valueType":"number"}'::jsonb)::text
WHERE level1_code = 'PQCT' AND level2_code = 'C0108' AND level3_code = 'C1'
  AND ref_value1::jsonb ->> 'table' = 'company_performances'
  AND ref_value1::jsonb ->> 'column' = 'job_type';

UPDATE common_codes
SET ref_value1 = (ref_value1::jsonb || '{"column":"jobclass"}'::jsonb)::text
WHERE level1_code = 'PQCT' AND level2_code = 'C0160' AND level3_code = 'C1'
  AND ref_value1::jsonb ->> 'table' = 'pq_engineer_project_history'
  AND ref_value1::jsonb ->> 'column' = 'jobpart';
