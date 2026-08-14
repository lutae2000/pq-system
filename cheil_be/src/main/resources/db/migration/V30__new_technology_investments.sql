CREATE TABLE IF NOT EXISTS new_technology_investments (
    id BIGSERIAL PRIMARY KEY,
    investment_year VARCHAR(4) NOT NULL,
    revenue NUMERIC(18, 2),
    total_assets NUMERIC(18, 2),
    equity_capital NUMERIC(18, 2),
    current_liabilities NUMERIC(18, 2),
    fixed_liabilities NUMERIC(18, 2),
    current_assets NUMERIC(18, 2),
    net_income NUMERIC(18, 2),
    total_liabilities NUMERIC(18, 2),
    technology_development_investment NUMERIC(18, 2),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT uq_new_technology_investments_year
        UNIQUE (investment_year),
    CONSTRAINT ck_new_technology_investments_year
        CHECK (investment_year ~ '^[0-9]{4}$'),
    CONSTRAINT ck_new_technology_investments_revenue
        CHECK (revenue IS NULL OR revenue >= 0),
    CONSTRAINT ck_new_technology_investments_total_assets
        CHECK (total_assets IS NULL OR total_assets >= 0),
    CONSTRAINT ck_new_technology_investments_equity_capital
        CHECK (equity_capital IS NULL OR equity_capital >= 0),
    CONSTRAINT ck_new_technology_investments_current_liabilities
        CHECK (current_liabilities IS NULL OR current_liabilities >= 0),
    CONSTRAINT ck_new_technology_investments_fixed_liabilities
        CHECK (fixed_liabilities IS NULL OR fixed_liabilities >= 0),
    CONSTRAINT ck_new_technology_investments_current_assets
        CHECK (current_assets IS NULL OR current_assets >= 0),
    CONSTRAINT ck_new_technology_investments_total_liabilities
        CHECK (total_liabilities IS NULL OR total_liabilities >= 0),
    CONSTRAINT ck_new_technology_investments_technology_investment
        CHECK (technology_development_investment IS NULL OR technology_development_investment >= 0)
);

CREATE INDEX IF NOT EXISTS ix_new_technology_investments_year
    ON new_technology_investments (investment_year DESC);

COMMENT ON TABLE new_technology_investments IS '신기술 투자실적';
COMMENT ON COLUMN new_technology_investments.id IS '신기술 투자실적 ID';
COMMENT ON COLUMN new_technology_investments.investment_year IS '연도';
COMMENT ON COLUMN new_technology_investments.revenue IS '매출액';
COMMENT ON COLUMN new_technology_investments.total_assets IS '총자산';
COMMENT ON COLUMN new_technology_investments.equity_capital IS '자기자본';
COMMENT ON COLUMN new_technology_investments.current_liabilities IS '유동부채';
COMMENT ON COLUMN new_technology_investments.fixed_liabilities IS '고정부채';
COMMENT ON COLUMN new_technology_investments.current_assets IS '유동자산';
COMMENT ON COLUMN new_technology_investments.net_income IS '당기순이익';
COMMENT ON COLUMN new_technology_investments.total_liabilities IS '부채총계';
COMMENT ON COLUMN new_technology_investments.technology_development_investment IS '기술개발투자액';
COMMENT ON COLUMN new_technology_investments.remark IS '비고';
COMMENT ON COLUMN new_technology_investments.created_at IS '작성일시';
COMMENT ON COLUMN new_technology_investments.created_id IS '작성자';
COMMENT ON COLUMN new_technology_investments.last_changed_at IS '수정일시';
COMMENT ON COLUMN new_technology_investments.last_changed_id IS '수정자';

INSERT INTO system_menus (
    menu_code, menu_name, parent_menu_code, menu_path, menu_type, sort_seq, use_yn, visible_yn, description
)
VALUES (
    'pq-new-technology-investments',
    '신기술 투자실적',
    'pq-management',
    '/pq/new-technology-investments',
    'PAGE',
    347,
    TRUE,
    TRUE,
    '신기술 투자실적 관리 화면'
)
ON CONFLICT (menu_code) DO UPDATE
SET menu_name = EXCLUDED.menu_name,
    parent_menu_code = EXCLUDED.parent_menu_code,
    menu_path = EXCLUDED.menu_path,
    menu_type = EXCLUDED.menu_type,
    sort_seq = EXCLUDED.sort_seq,
    use_yn = EXCLUDED.use_yn,
    visible_yn = EXCLUDED.visible_yn,
    description = EXCLUDED.description,
    last_changed_at = CURRENT_TIMESTAMP;

INSERT INTO role_permissions (role_code, menu_code, read_yn, create_yn, update_yn, delete_yn)
SELECT role_code, 'pq-new-technology-investments', TRUE, TRUE, TRUE, TRUE
FROM auth_roles
WHERE role_code = 'ADMIN'
ON CONFLICT (role_code, menu_code) DO NOTHING;

INSERT INTO new_technology_investments (
    investment_year,
    revenue,
    total_assets,
    equity_capital,
    current_liabilities,
    fixed_liabilities,
    current_assets,
    net_income,
    total_liabilities,
    technology_development_investment,
    created_id,
    last_changed_id
)
VALUES
    ('2023', 107359054613, 59252340566, 31103050884, 28149289682, NULL, 26799225974, 1949044202, 28149289682, 4005638970, 'SYSTEM', 'SYSTEM'),
    ('2024', 124263385729, 67301774743, 32615777480, 34685997263, NULL, 34792553237, 2288324518, 34685997263, 3196179710, 'SYSTEM', 'SYSTEM'),
    ('2025', 127270994552, 74462127814, 34801129921, 39660997893, NULL, 42622702506, 2980851464, 39660997893, 3819003117, 'SYSTEM', 'SYSTEM')
ON CONFLICT (investment_year) DO NOTHING;
