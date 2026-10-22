INSERT INTO notification_topics (
    notification_code, notification_name, description, menu_path, sort_seq, use_yn
) VALUES (
    'G2B_BID_NOTICE_CHANGE',
    '나라장터 공고 변경 알림',
    '등록된 공고가 변경되면 알림을 받습니다.',
    '/pq/g2b-bid-notice-candidates',
    30,
    TRUE
)
ON CONFLICT (notification_code) DO UPDATE SET
    notification_name = EXCLUDED.notification_name,
    description = EXCLUDED.description,
    menu_path = EXCLUDED.menu_path,
    sort_seq = EXCLUDED.sort_seq,
    use_yn = EXCLUDED.use_yn,
    last_changed_at = CURRENT_TIMESTAMP;
