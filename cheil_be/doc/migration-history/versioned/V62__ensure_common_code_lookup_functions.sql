-- Ensure both supported signatures exist even when an earlier migration was
-- applied partially or the function was created manually.

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
