CREATE TABLE IF NOT EXISTS shinindo_managements (
    id BIGSERIAL PRIMARY KEY,
    client_code VARCHAR(20) NOT NULL REFERENCES clients(client_code),
    item_name VARCHAR(300) NOT NULL,
    applied_yn VARCHAR(1) NOT NULL DEFAULT 'Y',
    acquired_date VARCHAR(8),
    valid_until VARCHAR(8),
    score NUMERIC(10, 2),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT uq_shinindo_managements_client_item UNIQUE (client_code, item_name),
    CONSTRAINT ck_shinindo_managements_applied_yn CHECK (applied_yn IN ('Y', 'N')),
    CONSTRAINT ck_shinindo_managements_acquired_date CHECK (acquired_date IS NULL OR acquired_date ~ '^[0-9]{8}$'),
    CONSTRAINT ck_shinindo_managements_valid_until CHECK (valid_until IS NULL OR valid_until ~ '^[0-9]{8}$'),
    CONSTRAINT ck_shinindo_managements_score CHECK (score IS NULL OR score >= 0)
);

CREATE INDEX IF NOT EXISTS ix_shinindo_managements_client_code
    ON shinindo_managements (client_code);
CREATE INDEX IF NOT EXISTS ix_shinindo_managements_item_name
    ON shinindo_managements (item_name);
CREATE INDEX IF NOT EXISTS ix_shinindo_managements_applied_yn
    ON shinindo_managements (applied_yn);
CREATE INDEX IF NOT EXISTS ix_shinindo_managements_valid_until
    ON shinindo_managements (valid_until);

COMMENT ON TABLE shinindo_managements IS '신인도 관리';
COMMENT ON COLUMN shinindo_managements.id IS '신인도 관리 ID';
COMMENT ON COLUMN shinindo_managements.client_code IS '발주청 코드';
COMMENT ON COLUMN shinindo_managements.item_name IS '신인도 항목';
COMMENT ON COLUMN shinindo_managements.applied_yn IS '해당여부';
COMMENT ON COLUMN shinindo_managements.acquired_date IS '취득일';
COMMENT ON COLUMN shinindo_managements.valid_until IS '유효기간';
COMMENT ON COLUMN shinindo_managements.remark IS '비고';
COMMENT ON COLUMN shinindo_managements.created_at IS '작성일시';
COMMENT ON COLUMN shinindo_managements.created_id IS '작성자';
COMMENT ON COLUMN shinindo_managements.last_changed_at IS '수정일시';
COMMENT ON COLUMN shinindo_managements.last_changed_id IS '수정자';

INSERT INTO system_menus (
    menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description
)
VALUES (
    'pq-shinindo-management',
    '신인도 관리',
    'pq-management',
    '/pq/shinindo-management',
    'PAGE',
    347,
    TRUE,
    TRUE,
    '신인도 관리 화면'
)
ON CONFLICT (menu_code) DO UPDATE
SET menu_name = EXCLUDED.menu_name,
    parent_menu_code = EXCLUDED.parent_menu_code,
    menu_path = EXCLUDED.menu_path,
    menu_type = EXCLUDED.menu_type,
    sort_seq = EXCLUDED.sort_seq,
    use_yn = EXCLUDED.use_yn,
    visible_yn = EXCLUDED.visible_yn,
    description = EXCLUDED.description,
    last_changed_at = CURRENT_TIMESTAMP;

INSERT INTO role_permissions (role_code, menu_code, read_yn, create_yn, update_yn, delete_yn)
SELECT role_code, 'pq-shinindo-management', TRUE, TRUE, TRUE, TRUE
FROM auth_roles
WHERE role_code = 'ADMIN'
ON CONFLICT (role_code, menu_code) DO NOTHING;
