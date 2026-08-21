CREATE TABLE IF NOT EXISTS new_employment_monthly_counts (
    id BIGSERIAL PRIMARY KEY,
    base_year_month VARCHAR(7) NOT NULL,
    department_code VARCHAR(20) NOT NULL,
    employee_count INTEGER,
    new_hire_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT uq_new_employment_monthly_counts UNIQUE (base_year_month, department_code),
    CONSTRAINT ck_new_employment_monthly_counts_month CHECK (base_year_month ~ '^[0-9]{4}-[0-9]{2}$'),
    CONSTRAINT ck_new_employment_monthly_counts_count CHECK (employee_count >= 0)
);

CREATE INDEX IF NOT EXISTS ix_new_employment_monthly_counts_01
    ON new_employment_monthly_counts (base_year_month, department_code);

COMMENT ON TABLE new_employment_monthly_counts IS '신규 고용률 월별 고용인원';

INSERT INTO new_employment_monthly_counts (
    base_year_month,
    department_code,
    employee_count,
    created_id,
    last_changed_id
)
SELECT
    to_char(to_date(hire_date, 'YYYYMMDD'), 'YYYY-MM') AS base_year_month,
    department_code,
    COUNT(*)::integer AS employee_count,
    'SYSTEM',
    'SYSTEM'
FROM pq_new_employment_employees
GROUP BY to_char(to_date(hire_date, 'YYYYMMDD'), 'YYYY-MM'), department_code
HAVING COUNT(*) > 0
ON CONFLICT (base_year_month, department_code) DO UPDATE
SET employee_count = EXCLUDED.employee_count,
    last_changed_at = CURRENT_TIMESTAMP,
    last_changed_id = EXCLUDED.last_changed_id;
