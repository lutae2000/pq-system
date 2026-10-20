ALTER TABLE app_file_attachments
    ALTER COLUMN file_size DROP DEFAULT;

ALTER TABLE app_file_attachments
    ALTER COLUMN file_size DROP NOT NULL;

COMMENT ON COLUMN app_file_attachments.file_size IS '파일 크기(알 수 없는 이관 파일은 NULL)';
