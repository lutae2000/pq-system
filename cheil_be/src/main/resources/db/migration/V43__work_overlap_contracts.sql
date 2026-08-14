CREATE TABLE IF NOT EXISTS work_overlap_contracts (
    contract_no VARCHAR(30) PRIMARY KEY,
    service_type VARCHAR(100),
    client_name VARCHAR(300),
    service_name VARCHAR(500) NOT NULL,
    construction_start_date VARCHAR(8),
    construction_complete_date VARCHAR(8),
    management_service_complete_date VARCHAR(8),
    construction_stop_from_date VARCHAR(8),
    construction_stop_to_date VARCHAR(8),
    restart_date VARCHAR(8),
    contract_amount NUMERIC(18),
    share_amount NUMERIC(18),
    performance_certification bool,
    participate_list_document bool,
    cems_confirm VARCHAR(30),
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_work_overlap_contracts_contract_no
    ON work_overlap_contracts (contract_no);
CREATE INDEX IF NOT EXISTS ix_work_overlap_contracts_service_name
    ON work_overlap_contracts (service_name);
CREATE INDEX IF NOT EXISTS ix_work_overlap_contracts_client_name
    ON work_overlap_contracts (client_name);
CREATE INDEX IF NOT EXISTS ix_work_overlap_contracts_start_date
    ON work_overlap_contracts (construction_start_date);



COMMENT ON TABLE work_overlap_contracts IS '업무중복도 계약관리';
COMMENT ON COLUMN work_overlap_contracts.contract_no IS '계약번호';
COMMENT ON COLUMN work_overlap_contracts.service_type IS '용역구분';
COMMENT ON COLUMN work_overlap_contracts.client_name IS '발주처';
COMMENT ON COLUMN work_overlap_contracts.service_name IS '용역명';
COMMENT ON COLUMN work_overlap_contracts.construction_start_date IS '공사시작일';
COMMENT ON COLUMN work_overlap_contracts.construction_complete_date IS '공사준공일';
COMMENT ON COLUMN work_overlap_contracts.management_service_complete_date IS '관리용역준공일';
COMMENT ON COLUMN work_overlap_contracts.construction_stop_from_date IS '공사중지시작일';
COMMENT ON COLUMN work_overlap_contracts.construction_stop_to_date IS '공사중지종료일';
COMMENT ON COLUMN work_overlap_contracts.restart_date IS '재개일';
COMMENT ON COLUMN work_overlap_contracts.contract_amount IS '계약금액';
COMMENT ON COLUMN work_overlap_contracts.share_amount IS '지분금액';
COMMENT ON COLUMN work_overlap_contracts.performance_certification IS '실적증명';
COMMENT ON COLUMN work_overlap_contracts.participate_list_document IS '참여명단문서';
COMMENT ON COLUMN work_overlap_contracts.cems_confirm IS 'CEMS 확인';
COMMENT ON COLUMN work_overlap_contracts.remark IS '비고';

INSERT INTO system_menus (
    menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description
)
VALUES (
    'pq-work-overlap-contracts',
    '업무중복도 계약관리',
    'pq-management',
    '/pq/work-overlap-contracts',
    'PAGE',
    349,
    TRUE,
    TRUE,
    '업무중복도 계약관리 화면'
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
SELECT role_code, 'pq-work-overlap-contracts', TRUE, TRUE, TRUE, TRUE
FROM auth_roles
WHERE role_code = 'ADMIN'
ON CONFLICT (role_code, menu_code) DO NOTHING;

ALTER TABLE work_overlap_contracts
    ALTER COLUMN contract_no TYPE VARCHAR(8),
    ALTER COLUMN contract_no SET NOT NULL;

UPDATE work_overlap_contracts
SET contract_no = 'C' || LPAD(SUBSTRING(contract_no FROM 2), 7, '0')
WHERE contract_no ~ '^C[0-9]+$' AND contract_no <> 'C' || LPAD(SUBSTRING(contract_no FROM 2), 7, '0');

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = current_schema()
          AND table_name = 'work_overlap_contracts'
          AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE work_overlap_contracts DROP CONSTRAINT work_overlap_contracts_pkey;
    END IF;
END $$;

ALTER TABLE work_overlap_contracts
    ADD CONSTRAINT pk_work_overlap_contracts PRIMARY KEY (contract_no);

ALTER TABLE work_overlap_contracts
    DROP COLUMN IF EXISTS id;

DROP INDEX IF EXISTS ux_work_overlap_contracts_contract_no;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relkind = 'S'
          AND relname = 'work_overlap_contracts_contract_no_seq'
    ) THEN
        CREATE SEQUENCE work_overlap_contracts_contract_no_seq START WITH 1 INCREMENT BY 1;
    END IF;
END $$;

SELECT setval(
    'work_overlap_contracts_contract_no_seq',
    COALESCE(
        (
            SELECT MAX(CAST(SUBSTRING(contract_no FROM 2) AS BIGINT))
            FROM work_overlap_contracts
            WHERE contract_no ~ '^C[0-9]{7}$'
        ),
        0
    ) + 1,
    false
);
