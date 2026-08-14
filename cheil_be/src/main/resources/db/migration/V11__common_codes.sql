CREATE TABLE IF NOT EXISTS common_codes (
    code_id BIGSERIAL PRIMARY KEY,
    code_level SMALLINT NOT NULL,
    level1_code VARCHAR(20) NOT NULL,
    level2_code VARCHAR(20) NOT NULL,
    level3_code VARCHAR(20),
    code_name VARCHAR(200) NOT NULL,
    code_detail_name VARCHAR(200),
    sort_order INTEGER,
    remark VARCHAR(500),
    ref_value1 VARCHAR(500),
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT uk_common_codes UNIQUE (code_level, level1_code, level2_code, level3_code)
);

COMMENT ON TABLE common_codes IS '기초코드';
COMMENT ON COLUMN common_codes.code_level IS '코드 레벨';
COMMENT ON COLUMN common_codes.level1_code IS '1레벨 코드';
COMMENT ON COLUMN common_codes.level2_code IS '2레벨 코드';
COMMENT ON COLUMN common_codes.level3_code IS '3레벨 코드';
COMMENT ON COLUMN common_codes.code_name IS '코드명';
COMMENT ON COLUMN common_codes.code_detail_name IS '코드 상세명';
COMMENT ON COLUMN common_codes.sort_order IS '정렬순서';
COMMENT ON COLUMN common_codes.remark IS '비고';
COMMENT ON COLUMN common_codes.ref_value1 IS '참조값 1';
COMMENT ON COLUMN common_codes.use_yn IS '사용여부';

CREATE INDEX IF NOT EXISTS idx_common_codes_level_path ON common_codes (code_level, level1_code, level2_code, level3_code);
CREATE INDEX IF NOT EXISTS idx_common_codes_code_name ON common_codes (code_name);
CREATE INDEX IF NOT EXISTS idx_common_codes_parent_lookup
    ON common_codes (level1_code, level2_code, code_level, use_yn);

UPDATE system_menus
SET menu_name = '?? ???? ??',
    description = '?? ???? ?? ??'
WHERE menu_code = 'common-code';
