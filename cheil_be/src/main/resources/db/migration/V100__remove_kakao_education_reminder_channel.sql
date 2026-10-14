-- 문자나라에서 제공하지 않는 카카오 알림톡 채널을 교육 알림에서 제거한다.
DELETE FROM education_reminder_templates
WHERE channel = 'KAKAO';

ALTER TABLE education_reminder_templates
    DROP CONSTRAINT IF EXISTS ck_education_reminder_templates_channel;

ALTER TABLE education_reminder_templates
    ADD CONSTRAINT ck_education_reminder_templates_channel
        CHECK (channel IN ('LMS', 'SMS'));
