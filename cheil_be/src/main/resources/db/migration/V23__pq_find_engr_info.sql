CREATE TABLE IF NOT EXISTS pq_find_engr_info (
    bid_seq BIGINT NOT NULL,
    work_duty_id VARCHAR(30) NOT NULL,
    engr_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT pk_pq_find_engr_info PRIMARY KEY (bid_seq, work_duty_id, engr_id),
    CONSTRAINT fk_pq_find_engr_info_engineer
        FOREIGN KEY (engr_id) REFERENCES pq_engineer_master (engr_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_pq_find_engr_info_bid_work
    ON pq_find_engr_info (bid_seq, work_duty_id);

CREATE INDEX IF NOT EXISTS ix_pq_find_engr_info_engr
    ON pq_find_engr_info (engr_id);

COMMENT ON TABLE pq_find_engr_info IS 'PQ참여 기술자 선정 정보';
COMMENT ON COLUMN pq_find_engr_info.bid_seq IS '공고문 시퀀스';
COMMENT ON COLUMN pq_find_engr_info.work_duty_id IS 'PQ작업자';
COMMENT ON COLUMN pq_find_engr_info.engr_id IS '엔지니어 ID';
COMMENT ON COLUMN pq_find_engr_info.created_at IS '생성 시각';
COMMENT ON COLUMN pq_find_engr_info.created_id IS '생성자';
COMMENT ON COLUMN pq_find_engr_info.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_find_engr_info.last_changed_id IS '최종 변경자';
