ALTER TABLE app_file_attachments
    ADD COLUMN IF NOT EXISTS display_order INTEGER;

ALTER TABLE app_file_attachments
    ADD CONSTRAINT ck_app_file_attachments_display_order
    CHECK (display_order IS NULL OR display_order BETWEEN 1 AND 99);

COMMENT ON COLUMN app_file_attachments.display_order IS '첨부파일 표시 순번(1~99, 선택 입력)';
