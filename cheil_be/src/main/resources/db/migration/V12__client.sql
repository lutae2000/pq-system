CREATE TABLE IF NOT EXISTS clients (
                                       client_code VARCHAR(20) PRIMARY KEY,
    order_name VARCHAR(300) NOT NULL,
    order_eng_name VARCHAR(300),
    business_no VARCHAR(20),
    corp_no VARCHAR(20),
    order_name_long VARCHAR(300),
    owner VARCHAR(100),
    business_sectors VARCHAR(100),
    business_items VARCHAR(100),
    order_class VARCHAR(20),
    zip_code VARCHAR(20),
    addr1 VARCHAR(500),
    addr2 VARCHAR(500),
    remark VARCHAR(1000),
    company_type VARCHAR(20),
    homeurl VARCHAR(500),
    otype VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
    );

CREATE INDEX IF NOT EXISTS ix_clients_order_name ON clients (order_name);
CREATE INDEX IF NOT EXISTS ix_clients_order_class ON clients (order_class);
CREATE INDEX IF NOT EXISTS ix_clients_company_type ON clients (company_type);

COMMENT ON TABLE clients IS '발주처 코드 관리';
COMMENT ON COLUMN clients.client_code IS '발주처 고유 코드';
COMMENT ON COLUMN clients.order_name IS '발주처 명(단명)';
COMMENT ON COLUMN clients.order_eng_name IS '발주처 영문명';
COMMENT ON COLUMN clients.business_no IS '사업자번호';
COMMENT ON COLUMN clients.corp_no IS '법인번호';
COMMENT ON COLUMN clients.order_name_long IS '발주처명(장명)';
COMMENT ON COLUMN clients.owner IS '대표자';
COMMENT ON COLUMN clients.business_sectors IS '업종';
COMMENT ON COLUMN clients.business_items IS '업태';
COMMENT ON COLUMN clients.order_class IS '발주처 분류';
COMMENT ON COLUMN clients.zip_code IS '우편번호';
COMMENT ON COLUMN clients.addr1 IS '주소1';
COMMENT ON COLUMN clients.addr2 IS '주소2';
COMMENT ON COLUMN clients.remark IS '비고';
COMMENT ON COLUMN clients.company_type IS '상위기관';
COMMENT ON COLUMN clients.homeurl IS '홈페이지 url';
COMMENT ON COLUMN clients.otype IS '발주처 유형';
COMMENT ON COLUMN clients.created_at IS '등록일시';
COMMENT ON COLUMN clients.created_id IS '등록자';
COMMENT ON COLUMN clients.last_changed_at IS '최종변경일시';
COMMENT ON COLUMN clients.last_changed_id IS '최종변경자';