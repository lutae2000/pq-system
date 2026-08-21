-- Keep the complete definition here as well so this migration is safe to
-- execute on databases where V60 was not applied yet.

CREATE OR REPLACE FUNCTION fn_common_code_name(
    p_level1_code VARCHAR,
    p_level2_code VARCHAR,
    p_level3_code VARCHAR
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

-- Explicit two-level overload so calls such as
--   fn_common_code_name('JOB', some_column)
-- resolve without relying on default arguments.

CREATE OR REPLACE FUNCTION fn_common_code_name(
    p_level1_code VARCHAR,
    p_level2_code VARCHAR
)
RETURNS VARCHAR
LANGUAGE SQL
STABLE
AS $$
    SELECT fn_common_code_name(p_level1_code, p_level2_code, NULL::VARCHAR)
$$;

COMMENT ON FUNCTION fn_common_code_name(VARCHAR, VARCHAR)
    IS 'Returns the active two-level common-code name.';
