ALTER TABLE clients RENAME COLUMN order_name_long TO order_name;

COMMENT ON COLUMN clients.order_name IS '발주처 정식 명칭';
