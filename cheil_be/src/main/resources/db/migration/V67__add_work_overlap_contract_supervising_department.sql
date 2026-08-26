ALTER TABLE work_overlap_contracts
    ADD COLUMN IF NOT EXISTS supervising_department_code VARCHAR(20);

COMMENT ON COLUMN work_overlap_contracts.supervising_department_code IS '주관부서 코드';
