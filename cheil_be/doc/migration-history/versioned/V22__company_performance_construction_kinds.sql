CREATE TABLE IF NOT EXISTS company_performance_construction_kinds (
    id BIGSERIAL PRIMARY KEY,
    seq BIGINT NOT NULL,
    level1_code VARCHAR(20) NOT NULL,
    level2_code VARCHAR(20) NOT NULL,
    level3_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_comp_perf_conkind_performance
        FOREIGN KEY (seq) REFERENCES company_performances (seq)
        ON DELETE CASCADE,
    CONSTRAINT uq_comp_perf_conkind_codes
        UNIQUE (seq, level1_code, level2_code, level3_code)
);

CREATE INDEX IF NOT EXISTS ix_company_performance_construction_kinds_seq
    ON company_performance_construction_kinds (seq);
CREATE INDEX IF NOT EXISTS ix_company_performance_construction_kinds_codes
    ON company_performance_construction_kinds (level1_code, level2_code, level3_code);
COMMENT ON COLUMN company_performance_construction_kinds.created_at IS '생성 시각';
COMMENT ON COLUMN company_performance_construction_kinds.last_changed_at IS '최종 변경 시각';

COMMENT ON TABLE company_performance_construction_kinds IS '회사실적 공사종류';
COMMENT ON COLUMN company_performance_construction_kinds.id IS '공사종류 ID';
COMMENT ON COLUMN company_performance_construction_kinds.seq IS '회사실적 SEQ';
COMMENT ON COLUMN company_performance_construction_kinds.level1_code IS '공통코드 1레벨 코드';
COMMENT ON COLUMN company_performance_construction_kinds.level2_code IS '공통코드 2레벨 코드';
COMMENT ON COLUMN company_performance_construction_kinds.level3_code IS '공통코드 3레벨 코드';

SELECT setval(pg_get_serial_sequence('company_performance_construction_kinds', 'id'), COALESCE((SELECT MAX(id) FROM company_performance_construction_kinds), 1));
