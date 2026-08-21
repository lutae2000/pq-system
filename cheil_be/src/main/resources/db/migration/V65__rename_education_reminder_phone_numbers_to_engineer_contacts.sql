ALTER TABLE IF EXISTS education_reminder_phone_numbers
    RENAME TO engineer_contacts;

ALTER TABLE engineer_contacts
    RENAME CONSTRAINT fk_education_reminder_phone_numbers_engineer
    TO fk_engineer_contacts_engineer;

COMMENT ON TABLE engineer_contacts IS '기술인 연락처';
