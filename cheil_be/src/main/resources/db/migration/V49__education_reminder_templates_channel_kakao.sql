ALTER TABLE education_reminder_templates
    DROP CONSTRAINT IF EXISTS ck_education_reminder_templates_channel;

ALTER TABLE education_reminder_templates
    ADD CONSTRAINT ck_education_reminder_templates_channel
        CHECK (channel IN ('LMS', 'SMS', 'KAKAO'));
