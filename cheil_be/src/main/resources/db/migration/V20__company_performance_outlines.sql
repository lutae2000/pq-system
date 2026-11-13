CREATE TABLE IF NOT EXISTS company_performance_outlines (
    id BIGSERIAL PRIMARY KEY,
    seq BIGINT NOT NULL,
    otln_gseq INTEGER,
    otln_lseq INTEGER,
    cate_code VARCHAR(20),
    subcate_code VARCHAR(20),
    cate_name VARCHAR(100),
    subcate_name VARCHAR(100),
    subcate_unit VARCHAR(50),
    otln_cont VARCHAR(500),
    sort_seq INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS ix_company_performance_outlines_seq ON company_performance_outlines (seq);
CREATE INDEX IF NOT EXISTS ix_company_performance_outlines_sort ON company_performance_outlines (seq, sort_seq, otln_gseq, otln_lseq, id);
COMMENT ON COLUMN company_performance_outlines.created_at IS '생성 시각';
COMMENT ON COLUMN company_performance_outlines.last_changed_at IS '최종 변경 시각';

COMMENT ON TABLE company_performance_outlines IS '회사실적 공사개요';
COMMENT ON COLUMN company_performance_outlines.id IS '공사개요 ID';
COMMENT ON COLUMN company_performance_outlines.seq IS '회사실적 ID';
COMMENT ON COLUMN company_performance_outlines.otln_gseq IS '공사 종류 번호';
COMMENT ON COLUMN company_performance_outlines.otln_lseq IS '공사 종류 시퀀스(정렬)';
COMMENT ON COLUMN company_performance_outlines.cate_code IS '공사 코드';
COMMENT ON COLUMN company_performance_outlines.subcate_code IS '공사 상세 코드';
COMMENT ON COLUMN company_performance_outlines.cate_name IS '공사 종류 이름';
COMMENT ON COLUMN company_performance_outlines.subcate_name IS '공사 상세 이름';
COMMENT ON COLUMN company_performance_outlines.subcate_unit IS '측량기준';
COMMENT ON COLUMN company_performance_outlines.otln_cont IS '측량수치';
COMMENT ON COLUMN company_performance_outlines.sort_seq IS '정렬 순서';