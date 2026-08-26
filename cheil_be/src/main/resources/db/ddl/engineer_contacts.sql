-- education_reminder_phone_numbers -> engineer_contacts
DO $$
BEGIN
    IF to_regclass('education_reminder_phone_numbers') IS NOT NULL
       AND to_regclass('engineer_contacts') IS NULL THEN
        ALTER TABLE education_reminder_phone_numbers
            RENAME TO engineer_contacts;
    END IF;
END
$$;

ALTER TABLE IF EXISTS engineer_contacts
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS created_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_changed_id VARCHAR(100);

DO $$
BEGIN
    IF to_regclass('engineer_contacts') IS NOT NULL
       AND EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conrelid = 'engineer_contacts'::regclass
             AND conname = 'fk_education_reminder_phone_numbers_engineer'
       ) THEN
        ALTER TABLE engineer_contacts
            RENAME CONSTRAINT fk_education_reminder_phone_numbers_engineer
            TO fk_engineer_contacts_engineer;
    END IF;
END
$$;

COMMENT ON TABLE engineer_contacts IS '기술인 연락처';
COMMENT ON COLUMN engineer_contacts.engr_id IS '기술인 ID';
COMMENT ON COLUMN engineer_contacts.phone_no IS '전화번호';
COMMENT ON COLUMN engineer_contacts.created_at IS '생성 시각';
COMMENT ON COLUMN engineer_contacts.created_id IS '생성자 ID';
COMMENT ON COLUMN engineer_contacts.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN engineer_contacts.last_changed_id IS '최종 변경자 ID';
