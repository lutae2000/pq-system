CREATE TABLE IF NOT EXISTS work_overlap_contract_engineers (
    contract_no VARCHAR(8) NOT NULL,
    engr_id VARCHAR(50) NOT NULL,
    field VARCHAR(100),
    participation_date VARCHAR(8),
    participation_type VARCHAR(100),
    pq_target_yn BOOLEAN NOT NULL DEFAULT FALSE,
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT pk_work_overlap_contract_engineers
        PRIMARY KEY (contract_no, engr_id),
    CONSTRAINT fk_work_overlap_contract_engineers_contract
        FOREIGN KEY (contract_no) REFERENCES work_overlap_contracts (contract_no)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_work_overlap_contract_engineers_contract_no
    ON work_overlap_contract_engineers (contract_no);
CREATE INDEX IF NOT EXISTS ix_work_overlap_contract_engineers_engr_id
    ON work_overlap_contract_engineers (engr_id);

COMMENT ON TABLE work_overlap_contract_engineers IS '업무중복도 계약 참여기술자';
COMMENT ON COLUMN work_overlap_contract_engineers.contract_no IS '계약번호';
COMMENT ON COLUMN work_overlap_contract_engineers.engr_id IS '기술자ID';
COMMENT ON COLUMN work_overlap_contract_engineers.field IS '분야';
COMMENT ON COLUMN work_overlap_contract_engineers.participation_date IS '참여날짜';
COMMENT ON COLUMN work_overlap_contract_engineers.participation_type IS '참여구분';
COMMENT ON COLUMN work_overlap_contract_engineers.pq_target_yn IS 'PQ대상자 여부';
COMMENT ON COLUMN work_overlap_contract_engineers.remark IS '비고';

CREATE TABLE IF NOT EXISTS work_overlap_contract_engineer_histories (
    id BIGSERIAL PRIMARY KEY,
    contract_no VARCHAR(8) NOT NULL,
    before_engr_id VARCHAR(50),
    after_engr_id VARCHAR(50),
    change_content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_work_overlap_contract_engineer_histories_contract
        FOREIGN KEY (contract_no) REFERENCES work_overlap_contracts (contract_no)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_work_overlap_contract_engineer_histories_contract_no
    ON work_overlap_contract_engineer_histories (contract_no);

COMMENT ON TABLE work_overlap_contract_engineer_histories IS '업무중복도 계약 참여기술자 변경이력';
COMMENT ON COLUMN work_overlap_contract_engineer_histories.contract_no IS '계약번호';
COMMENT ON COLUMN work_overlap_contract_engineer_histories.before_engr_id IS '변경전 기술자ID';
COMMENT ON COLUMN work_overlap_contract_engineer_histories.after_engr_id IS '변경후 기술자ID';
COMMENT ON COLUMN work_overlap_contract_engineer_histories.change_content IS '변경내용';
