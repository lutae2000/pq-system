CREATE TABLE IF NOT EXISTS new_employment_employees (
    id BIGSERIAL PRIMARY KEY,
    base_year_month VARCHAR(7) NOT NULL,
    employee_no VARCHAR(30),
    employee_name VARCHAR(100) NOT NULL,
    birth_date VARCHAR(8),
    hire_date VARCHAR(8) NOT NULL,
    department_code VARCHAR(30) NOT NULL,
    job_category VARCHAR(100),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT ck_new_employment_employees_month CHECK (base_year_month ~ '^[0-9]{4}-[0-9]{2}$'),
    CONSTRAINT ck_new_employment_employees_birth_date CHECK (birth_date IS NULL OR birth_date ~ '^[0-9]{8}$'),
    CONSTRAINT ck_new_employment_employees_hire_date CHECK (hire_date ~ '^[0-9]{8}$')
);

CREATE INDEX IF NOT EXISTS ix_new_employment_employees_01
    ON new_employment_employees (base_year_month, department_code, employee_name);

CREATE INDEX IF NOT EXISTS ix_new_employment_employees_02
    ON new_employment_employees (hire_date DESC);

COMMENT ON TABLE new_employment_employees IS '신규 고용자';

INSERT INTO new_employment_employees (
    to_char(to_date(hire_date, 'YYYYMMDD'), 'YYYY-MM') AS base_year_month,
    employee_no,
    employee_name,
    birth_date,
    hire_date,
    department_code,
    job_category,
    remark,
    created_at,
    created_id,
    last_changed_at,
    last_changed_id
)
SELECT
    base_year_month,
    employee_no,
    employee_name,
    birth_date,
    hire_date,
    department_code,
    job_category,
    remark,
    created_at,
    created_id,
    last_changed_at,
    last_changed_id
FROM pq_new_employment_employees
ON CONFLICT DO NOTHING;
