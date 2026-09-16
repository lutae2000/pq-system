CREATE TABLE IF NOT EXISTS notification_topics (
    notification_code VARCHAR(100) PRIMARY KEY,
    notification_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    menu_path VARCHAR(500) NOT NULL UNIQUE,
    sort_seq INTEGER NOT NULL DEFAULT 0,
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notification_topics IS '업무 알림 종류 마스터';
COMMENT ON COLUMN notification_topics.notification_code IS '알림 종류 식별 코드';
COMMENT ON COLUMN notification_topics.notification_name IS '화면 표시 알림명';
COMMENT ON COLUMN notification_topics.description IS '알림 내용 설명';
COMMENT ON COLUMN notification_topics.menu_path IS '알림 발생 및 이동 대상 메뉴 경로';
COMMENT ON COLUMN notification_topics.sort_seq IS '화면 표시 순서';
COMMENT ON COLUMN notification_topics.use_yn IS '알림 종류 사용 여부';
COMMENT ON COLUMN notification_topics.created_at IS '등록 일시';
COMMENT ON COLUMN notification_topics.last_changed_at IS '최종 변경 일시';

INSERT INTO notification_topics (
    notification_code, notification_name, description, menu_path, sort_seq, use_yn
) VALUES
    ('NEW_TECHNOLOGY_DEVELOPMENT', '신기술 개발실적', '신규 개발실적이 등록되면 알림을 받습니다.', '/pq/new-technology-developments', 10, TRUE),
    ('NEW_TECHNOLOGY_USAGE', '신기술 활용실적', '신규 활용실적이 등록되면 알림을 받습니다.', '/pq/new-technology-usages', 20, TRUE)
ON CONFLICT (notification_code) DO UPDATE SET
    notification_name = EXCLUDED.notification_name,
    description = EXCLUDED.description,
    menu_path = EXCLUDED.menu_path,
    sort_seq = EXCLUDED.sort_seq,
    use_yn = EXCLUDED.use_yn,
    last_changed_at = CURRENT_TIMESTAMP;
