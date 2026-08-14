WITH seed_source AS (
    SELECT
        gs AS seq_no,
        date '2023-07-29' + ((gs * 37 + 13) % 1096) AS hire_date
    FROM generate_series(1, 100) AS gs
),
lookup AS (
    SELECT
        ARRAY[
            '홍길동', '김철수', '이영희', '박민수', '최지은', '정수빈', '강호준', '한지민', '오세훈', '윤가은',
            '서민우', '조현아', '배준호', '문지아', '손태현', '임수아', '장도윤', '남지우', '허서윤', '고예준',
            '문수진', '안태호', '백하늘', '차민재'
        ] AS names,
        ARRAY['D001', 'D002', 'D003', 'D004'] AS department_codes,
        ARRAY['토목', '건축', '기계', '전기', '품질', '안전', '공무', '관리'] AS job_categories
),
prepared_employees AS (
    SELECT
        format('NE%s%s', to_char(source.hire_date, 'YYYYMM'), lpad(source.seq_no::text, 3, '0')) AS employee_no,
        names[((source.seq_no - 1) % array_length(names, 1)) + 1] AS employee_name,
        to_char(date '1986-01-01' + ((source.seq_no * 53 + 19) % 10000), 'YYYYMMDD') AS birth_date,
        to_char(source.hire_date, 'YYYYMMDD') AS hire_date,
        department_codes[((source.seq_no - 1) % array_length(department_codes, 1)) + 1] AS department_code,
        job_categories[((source.seq_no - 1) % array_length(job_categories, 1)) + 1] AS job_category,
        format('%s 신입사원', to_char(source.hire_date, 'YYYYMM')) AS remark
    FROM seed_source source
    CROSS JOIN lookup
)
INSERT INTO pq_new_employment_employees (
    employee_no,
    employee_name,
    birth_date,
    hire_date,
    department_code,
    job_category,
    remark,
    created_id,
    last_changed_id
)
SELECT
    employee_no,
    employee_name,
    birth_date,
    hire_date,
    department_code,
    job_category,
    remark,
    'SYSTEM',
    'SYSTEM'
FROM prepared_employees
WHERE NOT EXISTS (
    SELECT 1
    FROM pq_new_employment_employees
);

INSERT INTO pq_new_employment_monthly_counts (
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
WHERE hire_date BETWEEN '20230729' AND '20260728'
GROUP BY to_char(to_date(hire_date, 'YYYYMMDD'), 'YYYY-MM'), department_code
HAVING COUNT(*) > 0
ON CONFLICT (base_year_month, department_code) DO UPDATE
SET employee_count = EXCLUDED.employee_count,
    last_changed_at = CURRENT_TIMESTAMP,
    last_changed_id = EXCLUDED.last_changed_id;
