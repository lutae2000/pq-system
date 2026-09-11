ALTER TABLE work_overlap_contracts
    ADD COLUMN IF NOT EXISTS joint_contract_ratio VARCHAR(100);

COMMENT ON COLUMN work_overlap_contracts.joint_contract_ratio IS '공동도급비율';
