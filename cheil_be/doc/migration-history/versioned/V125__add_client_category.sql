ALTER TABLE cheileng.clients
    ADD COLUMN IF NOT EXISTS client_category VARCHAR(100);

COMMENT ON COLUMN cheileng.clients.client_category IS '발주처 구분';
