ALTER TABLE system_notices
    ADD COLUMN IF NOT EXISTS target_path VARCHAR(500);

COMMENT ON COLUMN system_notices.target_path IS '알림 클릭 시 이동할 메뉴 경로';
