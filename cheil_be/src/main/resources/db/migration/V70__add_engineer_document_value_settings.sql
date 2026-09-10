CREATE TABLE pq_engineer_document_value_settings (
    bid_seq BIGINT NOT NULL,
    engr_id VARCHAR(20) NOT NULL,
    selected_education_id BIGINT,
    selected_license_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT pk_pq_engineer_document_value_settings PRIMARY KEY (bid_seq, engr_id),
    CONSTRAINT fk_pq_document_value_setting_school
        FOREIGN KEY (selected_education_id) REFERENCES pq_engineer_school (id) ON DELETE SET NULL,
    CONSTRAINT fk_pq_document_value_setting_license
        FOREIGN KEY (selected_license_id) REFERENCES pq_engineer_license (id) ON DELETE SET NULL
);

COMMENT ON TABLE pq_engineer_document_value_settings IS '공고별 기술인 문서 작성값 설정';
COMMENT ON COLUMN pq_engineer_document_value_settings.bid_seq IS '공고 순번';
COMMENT ON COLUMN pq_engineer_document_value_settings.engr_id IS '기술인 ID';
COMMENT ON COLUMN pq_engineer_document_value_settings.selected_education_id IS '문서에 사용할 학력 ID';
COMMENT ON COLUMN pq_engineer_document_value_settings.selected_license_id IS '문서에 사용할 자격 ID';

CREATE INDEX idx_pq_document_value_settings_engineer
    ON pq_engineer_document_value_settings (engr_id);
