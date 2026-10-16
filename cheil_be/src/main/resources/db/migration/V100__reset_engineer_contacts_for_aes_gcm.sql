-- 기존 전화번호는 AES-GCM 형식과 키가 보장되지 않으므로 초기화한다.
-- 이후 화면에서 전화번호를 다시 저장하면 현재 AES-256-GCM 형식으로 저장된다.
TRUNCATE TABLE engineer_contacts;

ALTER TABLE engineer_contacts
    ALTER COLUMN phone_no TYPE TEXT;
