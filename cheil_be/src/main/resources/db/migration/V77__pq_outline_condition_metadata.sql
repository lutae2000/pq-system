-- Store only metadata used by outline input and related project-history queries.
-- ddlbYn, ddlbHeadYn, ddlbGroupCode and subcateUnit are consumed by the
-- company-performance outline input screen and must remain unchanged.

WITH outline_metadata AS (
    SELECT code_id, ref_value1::jsonb AS metadata
    FROM common_codes
    WHERE level1_code = 'PQCT'
      AND level2_code LIKE 'Z%'
      AND level3_code IS NOT NULL
      AND level3_code <> ''
      AND ref_value1 IS NOT NULL
)
UPDATE common_codes AS common_code
SET ref_value1 = jsonb_build_object(
        'subcateUnit', COALESCE(outline_metadata.metadata ->> 'subcateUnit', ''),
        'ddlbYn', COALESCE(outline_metadata.metadata ->> 'ddlbYn', 'N'),
        'ddlbHeadYn', COALESCE(outline_metadata.metadata ->> 'ddlbHeadYn', 'N'),
        'ddlbGroupCode', COALESCE(outline_metadata.metadata ->> 'ddlbGroupCode', ''),
        'table', 'company_performance_outlines',
        'column', 'otln_cont',
        'valueType', CASE
            WHEN COALESCE(outline_metadata.metadata ->> 'valueType', '') IN ('number', 'date', 'text', 'code')
                THEN outline_metadata.metadata ->> 'valueType'
            WHEN UPPER(COALESCE(outline_metadata.metadata ->> 'subcateType', '')) = 'N'
                THEN 'number'
            ELSE 'text'
        END
    ),
    last_changed_at = CURRENT_TIMESTAMP,
    last_changed_id = 'migration'
FROM outline_metadata
WHERE common_code.code_id = outline_metadata.code_id;
