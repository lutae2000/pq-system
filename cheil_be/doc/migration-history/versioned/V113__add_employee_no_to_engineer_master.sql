ALTER TABLE pq_engineer_master ADD COLUMN employee_no VARCHAR(20);

COMMENT ON COLUMN pq_engineer_master.employee_no IS '사번';
