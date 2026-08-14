CREATE TABLE IF NOT EXISTS app_file_attachments (
    attachment_id BIGSERIAL PRIMARY KEY,
    owner_type VARCHAR(100),
    owner_id VARCHAR(100),
    attachment_type VARCHAR(50),
    file_id VARCHAR(100) NOT NULL UNIQUE,
    original_filename VARCHAR(300) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    stored_filename VARCHAR(300) NOT NULL,
    content_type VARCHAR(200),
    file_size BIGINT NOT NULL DEFAULT 0,
    download_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS ix_app_file_attachments_owner ON app_file_attachments(owner_type, owner_id, attachment_type, created_at DESC);

COMMENT ON TABLE app_file_attachments IS '공통 첨부파일';
COMMENT ON COLUMN app_file_attachments.owner_type IS '첨부 대상 업무 구분';
COMMENT ON COLUMN app_file_attachments.owner_id IS '첨부 대상 ID';
COMMENT ON COLUMN app_file_attachments.attachment_type IS '첨부 파일 분류';
COMMENT ON COLUMN app_file_attachments.original_filename IS '실제 파일명';
COMMENT ON COLUMN app_file_attachments.stored_path IS '서버 업로드 파일 경로';
COMMENT ON COLUMN app_file_attachments.stored_filename IS '서버 업로드 파일명';
