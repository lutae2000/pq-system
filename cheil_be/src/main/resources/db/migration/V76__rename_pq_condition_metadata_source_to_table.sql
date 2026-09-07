-- Keep databases that already applied V75 compatible with the table-based metadata key.

UPDATE common_codes
SET ref_value1 = jsonb_set(
        ref_value1::jsonb - 'source',
        '{table}',
        ref_value1::jsonb -> 'source'
    )::text,
    last_changed_at = CURRENT_TIMESTAMP,
    last_changed_id = 'migration'
WHERE level1_code = 'PQCT'
  AND ref_value1 IS NOT NULL
  AND ref_value1::jsonb ? 'source'
  AND NOT (ref_value1::jsonb ? 'table');
