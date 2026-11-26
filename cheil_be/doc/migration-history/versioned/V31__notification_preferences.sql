CREATE TABLE IF NOT EXISTS notification_preferences (
    login_id VARCHAR(100) NOT NULL,
    menu_path VARCHAR(500) NOT NULL,
    receive_yn BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (login_id, menu_path)
);

COMMENT ON TABLE notification_preferences IS '사용자별 업무 알림 수신 설정';
COMMENT ON COLUMN notification_preferences.login_id IS '알림 설정 사용자 로그인 ID';
COMMENT ON COLUMN notification_preferences.menu_path IS '알림 대상 메뉴 경로';
COMMENT ON COLUMN notification_preferences.receive_yn IS '알림 수신 여부';
COMMENT ON COLUMN notification_preferences.created_at IS '최초 설정 일시';
COMMENT ON COLUMN notification_preferences.last_changed_at IS '최종 변경 일시';
