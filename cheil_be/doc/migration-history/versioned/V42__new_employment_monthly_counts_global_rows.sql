INSERT INTO new_employment_monthly_counts (
    base_year_month,
    department_code,
    employee_count,
    new_hire_count,
    created_id,
    last_changed_id
)
SELECT
    base_year_month,
    'ALL',
    SUM(employee_count)::integer AS employee_count,
    SUM(COALESCE(new_hire_count, 0))::integer AS new_hire_count,
    'SYSTEM',
    'SYSTEM'
FROM new_employment_monthly_counts
WHERE department_code <> 'ALL'
GROUP BY base_year_month
ON CONFLICT (base_year_month, department_code) DO UPDATE
SET employee_count = EXCLUDED.employee_count,
    new_hire_count = EXCLUDED.new_hire_count,
    last_changed_at = CURRENT_TIMESTAMP,
    last_changed_id = EXCLUDED.last_changed_id;
