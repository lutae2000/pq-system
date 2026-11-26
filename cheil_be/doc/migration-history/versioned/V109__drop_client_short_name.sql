UPDATE clients
SET order_name_long = order_name
WHERE order_name_long IS NULL OR order_name_long ~ '^[[:space:]]*$';

ALTER TABLE clients
    ALTER COLUMN order_name_long SET NOT NULL,
    DROP COLUMN order_name;
