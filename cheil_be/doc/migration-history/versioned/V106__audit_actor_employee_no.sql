-- Convert historical audit values that match a current login ID to employee numbers.
-- Service actors such as 'system' and values without an account match remain unchanged.
DO $$
DECLARE
    audit_column RECORD;
BEGIN
    FOR audit_column IN
        SELECT columns.table_schema, columns.table_name, columns.column_name
        FROM information_schema.columns AS columns
        JOIN information_schema.tables AS tables
          ON tables.table_schema = columns.table_schema
         AND tables.table_name = columns.table_name
        WHERE columns.table_schema = current_schema()
          AND tables.table_type = 'BASE TABLE'
          AND columns.column_name IN ('created_id', 'last_changed_id')
          AND columns.data_type IN ('character varying', 'character', 'text')
    LOOP
        EXECUTE format(
            'UPDATE %I.%I AS target SET %I = account.employee_no FROM auth_users AS account WHERE target.%I = account.login_id AND target.%I IS DISTINCT FROM account.employee_no',
            audit_column.table_schema, audit_column.table_name,
            audit_column.column_name, audit_column.column_name, audit_column.column_name
        );
    END LOOP;
END $$;
