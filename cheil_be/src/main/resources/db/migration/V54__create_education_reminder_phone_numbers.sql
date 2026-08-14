CREATE TABLE education_reminder_phone_numbers (
    engr_id VARCHAR(20) PRIMARY KEY,
    phone_no VARCHAR(50) NOT NULL
);

ALTER TABLE education_reminder_phone_numbers
    ADD CONSTRAINT fk_education_reminder_phone_numbers_engineer
        FOREIGN KEY (engr_id) REFERENCES pq_engineer_master (engr_id) ON DELETE CASCADE;

COMMENT ON TABLE education_reminder_phone_numbers IS '교육 알림 발송 전화번호';
COMMENT ON COLUMN education_reminder_phone_numbers.engr_id IS '기술인 ID';
COMMENT ON COLUMN education_reminder_phone_numbers.phone_no IS '전화번호';
