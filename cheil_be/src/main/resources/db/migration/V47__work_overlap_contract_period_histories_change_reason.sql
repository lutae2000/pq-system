ALTER TABLE work_overlap_contract_period_histories
    ADD COLUMN IF NOT EXISTS change_reason TEXT;

COMMENT ON COLUMN work_overlap_contract_period_histories.change_reason IS 'Period change reason';
