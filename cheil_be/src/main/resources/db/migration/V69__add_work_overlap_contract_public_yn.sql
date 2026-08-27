ALTER TABLE work_overlap_contracts
    ADD COLUMN IF NOT EXISTS public_contract_yn BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN work_overlap_contracts.public_contract_yn IS '공개계약 여부';
