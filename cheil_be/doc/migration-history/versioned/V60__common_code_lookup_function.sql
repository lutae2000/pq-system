-- Small, reusable common-code lookup function for SQL queries and reports.
-- Example:
--   SELECT fn_common_code_name('JOB', '01', NULL);
--   SELECT fn_common_code_name('JOB', '01', '001');

CREATE OR REPLACE FUNCTION fn_common_code_name(
    p_level1_code VARCHAR,
    p_level2_code VARCHAR,
    p_level3_code VARCHAR DEFAULT NULL
)
RETURNS VARCHAR
LANGUAGE SQL
STABLE
AS $$
    SELECT cc.code_name
    FROM common_codes cc
    WHERE cc.use_yn = TRUE
      AND cc.level1_code = NULLIF(BTRIM(p_level1_code), '')
      AND cc.level2_code = NULLIF(BTRIM(p_level2_code), '')
      AND cc.level3_code IS NOT DISTINCT FROM NULLIF(BTRIM(p_level3_code), '')
    LIMIT 1
$$;

COMMENT ON FUNCTION fn_common_code_name(VARCHAR, VARCHAR, VARCHAR)
    IS 'Returns the active common-code name by hierarchical code path.';
