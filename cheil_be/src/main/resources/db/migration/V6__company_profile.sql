CREATE TABLE IF NOT EXISTS company_profiles (
    profile_id BIGINT PRIMARY KEY DEFAULT 1 CHECK (profile_id = 1),
    company_name VARCHAR(200) NOT NULL,
    business_registration_no VARCHAR(30),
    corporate_registration_no VARCHAR(30),
    representative_name VARCHAR(100),
    established_on DATE,
    postal_code VARCHAR(20),
    address VARCHAR(300),
    address_detail VARCHAR(300),
    phone_no VARCHAR(50),
    fax_no VARCHAR(50),
    homepage_url VARCHAR(300),
    business_type VARCHAR(100),
    business_item VARCHAR(300),
    main_business VARCHAR(500),
    memo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS company_profile_hist (
    hist_id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(100),
    change_type VARCHAR(30) NOT NULL,
    change_summary VARCHAR(500),
    snapshot_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS company_financial_statuses (
    financial_id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT NOT NULL DEFAULT 1 REFERENCES company_profiles(profile_id),
    fiscal_year INTEGER NOT NULL,
    capital_amount_million NUMERIC(18, 2),
    sales_amount_million NUMERIC(18, 2),
    debt_ratio NUMERIC(10, 2),
    current_ratio NUMERIC(10, 2),
    credit_rating VARCHAR(50),
    registered_on DATE,
    note VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS company_attachments (
    attachment_id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT NOT NULL DEFAULT 1 REFERENCES company_profiles(profile_id),
    attachment_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    fiscal_year INTEGER,
    issued_on DATE,
    valid_until DATE,
    file_id VARCHAR(100) NOT NULL,
    original_filename VARCHAR(300) NOT NULL,
    content_type VARCHAR(200),
    file_size BIGINT NOT NULL DEFAULT 0,
    download_url VARCHAR(500) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_company_profile_hist_profile ON company_profile_hist(profile_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_financial_year ON company_financial_statuses(profile_id, fiscal_year DESC);
CREATE INDEX IF NOT EXISTS idx_company_attachments_type ON company_attachments(profile_id, attachment_type, created_at DESC);

INSERT INTO company_profiles (
    profile_id,
    company_name,
    business_registration_no,
    corporate_registration_no,
    representative_name,
    established_on,
    postal_code,
    address,
    address_detail,
    phone_no,
    fax_no,
    homepage_url,
    business_type,
    business_item,
    main_business,
    memo
)
VALUES (
    1,
    '(주)예시건설',
    '123-45-67890',
    '110111-1234567',
    '홍길동',
    DATE '2010-01-15',
    '06100',
    '서울특별시 강남구 테헤란로 123',
    '10층',
    '02-1234-5678',
    '02-1234-5679',
    'https://www.example.co.kr',
    '건설업',
    '토목, 건축, 산업설비 공사',
    '토목, 건축, 산업설비 공사',
    NULL
)
ON CONFLICT (profile_id) DO NOTHING;

INSERT INTO company_financial_statuses (
    profile_id,
    fiscal_year,
    capital_amount_million,
    sales_amount_million,
    debt_ratio,
    current_ratio,
    credit_rating,
    registered_on,
    note
)
VALUES
    (1, 2025, 1000, 8500, 78.5, 128.6, 'A- (안정적)', DATE '2025-05-10', NULL),
    (1, 2024, 800, 7200, 75.2, 135.4, 'BBB+ (안정적)', DATE '2024-05-10', NULL),
    (1, 2023, 800, 6300, 70.1, 140.2, 'BBB (안정적)', DATE '2023-05-11', NULL)
ON CONFLICT DO NOTHING;

-- Menu seed for headquarters-profile is defined in V1__init_schema.sql.
