ALTER TABLE education_reminder_phone_numbers
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS created_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_changed_id VARCHAR(100);

COMMENT ON COLUMN education_reminder_phone_numbers.created_at IS '생성 시각';
COMMENT ON COLUMN education_reminder_phone_numbers.created_id IS '생성자 ID';
COMMENT ON COLUMN education_reminder_phone_numbers.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN education_reminder_phone_numbers.last_changed_id IS '최종 변경자 ID';
