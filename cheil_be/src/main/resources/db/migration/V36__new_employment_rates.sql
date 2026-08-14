CREATE TABLE IF NOT EXISTS pq_new_employment_monthly_counts (
    id BIGSERIAL PRIMARY KEY,
    base_year_month VARCHAR(7) NOT NULL,
    department_code VARCHAR(20) NOT NULL,
    employee_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT uq_pq_new_employment_monthly_counts UNIQUE (base_year_month, department_code),
    CONSTRAINT ck_pq_new_employment_monthly_counts_month CHECK (base_year_month ~ '^[0-9]{4}-[0-9]{2}$'),
    CONSTRAINT ck_pq_new_employment_monthly_counts_count CHECK (employee_count >= 0)
);

CREATE TABLE IF NOT EXISTS pq_new_employment_employees (
    id BIGSERIAL PRIMARY KEY,
    base_year_month VARCHAR(7) NOT NULL,
    employee_no VARCHAR(30),
    employee_name VARCHAR(100) NOT NULL,
    birth_date VARCHAR(8),
    hire_date VARCHAR(8) NOT NULL,
    department_code VARCHAR(20) NOT NULL,
    job_category VARCHAR(100),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT ck_pq_new_employment_employees_month CHECK (base_year_month ~ '^[0-9]{4}-[0-9]{2}$'),
    CONSTRAINT ck_pq_new_employment_employees_birth_date CHECK (birth_date IS NULL OR birth_date ~ '^[0-9]{8}$'),
    CONSTRAINT ck_pq_new_employment_employees_hire_date CHECK (hire_date ~ '^[0-9]{8}$')
);

CREATE INDEX IF NOT EXISTS ix_pq_new_employment_monthly_counts_01
    ON pq_new_employment_monthly_counts (base_year_month, department_code);

CREATE INDEX IF NOT EXISTS ix_pq_new_employment_employees_01
    ON pq_new_employment_employees (base_year_month, department_code, employee_name);

CREATE INDEX IF NOT EXISTS ix_pq_new_employment_employees_02
    ON pq_new_employment_employees (hire_date DESC);

COMMENT ON TABLE pq_new_employment_monthly_counts IS '신규 고용률 월별 고용인원';
COMMENT ON TABLE pq_new_employment_employees IS '신규 고용률 신규 고용자';

INSERT INTO system_menus (
    menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description
)
VALUES (
    'pq-new-employment-rates',
    '신규 고용률 관리',
    'pq-management',
    '/pq/new-employment-rates',
    'PAGE',
    349,
    TRUE,
    TRUE,
    '신규 고용률 관리 화면'
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
SELECT role_code, 'pq-new-employment-rates', TRUE, TRUE, TRUE, TRUE
FROM auth_roles
WHERE role_code = 'ADMIN'
ON CONFLICT (role_code, menu_code) DO NOTHING;
