CREATE TABLE IF NOT EXISTS pq_qualification_review_agencies (
    id BIGSERIAL PRIMARY KEY,
    agency_code VARCHAR(20) NOT NULL,
    agency_name VARCHAR(200) NOT NULL,
    remark VARCHAR(500),
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_changed_id VARCHAR(100),
    CONSTRAINT uq_pq_qualification_review_agencies_code UNIQUE (agency_code)
);

COMMENT ON TABLE pq_qualification_review_agencies IS '적격심사 기관';
COMMENT ON COLUMN pq_qualification_review_agencies.id IS '기관 ID';
COMMENT ON COLUMN pq_qualification_review_agencies.agency_code IS '기관 코드';
COMMENT ON COLUMN pq_qualification_review_agencies.agency_name IS '기관 명';
COMMENT ON COLUMN pq_qualification_review_agencies.remark IS '비고';
COMMENT ON COLUMN pq_qualification_review_agencies.use_yn IS '사용 여부';
COMMENT ON COLUMN pq_qualification_review_agencies.created_at IS '생성 시각';
COMMENT ON COLUMN pq_qualification_review_agencies.created_id IS '생성자 ID';
COMMENT ON COLUMN pq_qualification_review_agencies.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_qualification_review_agencies.last_changed_id IS '최종 변경자 ID';

CREATE INDEX IF NOT EXISTS idx_pq_qualification_review_agencies_name
    ON pq_qualification_review_agencies (agency_name);

CREATE TABLE IF NOT EXISTS pq_qualification_review_criteria (
    id BIGSERIAL PRIMARY KEY,
    agency_id BIGINT NOT NULL,
    rule_code VARCHAR(30) NOT NULL,
    revision_no VARCHAR(20) NOT NULL,
    effective_date VARCHAR(10),
    legal_basis VARCHAR(300),
    technical_weight NUMERIC(10, 3),
    price_weight NUMERIC(10, 3),
    decision_method VARCHAR(500),
    threshold_ratio NUMERIC(10, 4),
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_pq_qualification_review_criteria_agency
        FOREIGN KEY (agency_id)
        REFERENCES pq_qualification_review_agencies (id)
        ON DELETE CASCADE,
    CONSTRAINT uq_pq_qualification_review_criteria_rule
        UNIQUE (agency_id, rule_code, revision_no)
);

COMMENT ON TABLE pq_qualification_review_criteria IS '적격심사 시행기준';
COMMENT ON COLUMN pq_qualification_review_criteria.id IS '시행기준 ID';
COMMENT ON COLUMN pq_qualification_review_criteria.agency_id IS '기관 ID';
COMMENT ON COLUMN pq_qualification_review_criteria.rule_code IS '심사기준 코드';
COMMENT ON COLUMN pq_qualification_review_criteria.revision_no IS '차수';
COMMENT ON COLUMN pq_qualification_review_criteria.effective_date IS '시행 일자';
COMMENT ON COLUMN pq_qualification_review_criteria.legal_basis IS '관련 근거';
COMMENT ON COLUMN pq_qualification_review_criteria.technical_weight IS '기술 배점';
COMMENT ON COLUMN pq_qualification_review_criteria.price_weight IS '가격 배점';
COMMENT ON COLUMN pq_qualification_review_criteria.decision_method IS '낙찰자 결정 방법';
COMMENT ON COLUMN pq_qualification_review_criteria.threshold_ratio IS '기준 비율';
COMMENT ON COLUMN pq_qualification_review_criteria.use_yn IS '사용 여부';
COMMENT ON COLUMN pq_qualification_review_criteria.created_at IS '생성 시각';
COMMENT ON COLUMN pq_qualification_review_criteria.created_id IS '생성자 ID';
COMMENT ON COLUMN pq_qualification_review_criteria.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_qualification_review_criteria.last_changed_id IS '최종 변경자 ID';

CREATE INDEX IF NOT EXISTS idx_pq_qualification_review_criteria_agency
    ON pq_qualification_review_criteria (agency_id);

CREATE TABLE IF NOT EXISTS pq_qualification_score_bands (
    id BIGSERIAL PRIMARY KEY,
    criterion_id BIGINT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    min_price NUMERIC(18, 0),
    max_price NUMERIC(18, 0),
    price_text VARCHAR(200),
    pass_score NUMERIC(10, 3),
    technical_score NUMERIC(10, 3),
    career_score NUMERIC(10, 3),
    region_score NUMERIC(10, 3),
    management_score NUMERIC(10, 3),
    price_score NUMERIC(10, 3),
    price_multiplier NUMERIC(10, 3),
    price_formula VARCHAR(500),
    technical_average_score NUMERIC(10, 3),
    total_average_score NUMERIC(10, 3),
    lowest_bid_price NUMERIC(10, 3),
    pq_available_score NUMERIC(10, 3),
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    remark VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_pq_qualification_score_bands_criterion
        FOREIGN KEY (criterion_id)
        REFERENCES pq_qualification_review_criteria (id)
        ON DELETE CASCADE,
    CONSTRAINT uq_pq_qualification_score_bands_order
        UNIQUE (criterion_id, sort_order)
);

COMMENT ON TABLE pq_qualification_score_bands IS '적격심사 가격구간 평가점수';
COMMENT ON COLUMN pq_qualification_score_bands.id IS '가격구간 ID';
COMMENT ON COLUMN pq_qualification_score_bands.criterion_id IS '시행기준 ID';
COMMENT ON COLUMN pq_qualification_score_bands.sort_order IS '정렬 순서';
COMMENT ON COLUMN pq_qualification_score_bands.min_price IS '추정 가격 이상';
COMMENT ON COLUMN pq_qualification_score_bands.max_price IS '추정 가격 미만';
COMMENT ON COLUMN pq_qualification_score_bands.price_text IS '가격구간 표시';
COMMENT ON COLUMN pq_qualification_score_bands.pass_score IS '적격 점수';
COMMENT ON COLUMN pq_qualification_score_bands.technical_score IS '기술 점수';
COMMENT ON COLUMN pq_qualification_score_bands.career_score IS '경력 점수';
COMMENT ON COLUMN pq_qualification_score_bands.region_score IS '지역 점수';
COMMENT ON COLUMN pq_qualification_score_bands.management_score IS '경영상태 점수';
COMMENT ON COLUMN pq_qualification_score_bands.price_score IS '가격 점수';
COMMENT ON COLUMN pq_qualification_score_bands.price_multiplier IS '가격 배율';
COMMENT ON COLUMN pq_qualification_score_bands.price_formula IS '가격점수 산식';
COMMENT ON COLUMN pq_qualification_score_bands.technical_average_score IS '기술평점';
COMMENT ON COLUMN pq_qualification_score_bands.total_average_score IS '종합평점';
COMMENT ON COLUMN pq_qualification_score_bands.lowest_bid_price IS '최저 투찰가';
COMMENT ON COLUMN pq_qualification_score_bands.pq_available_score IS '투찰 가능 PQ점수';
COMMENT ON COLUMN pq_qualification_score_bands.use_yn IS '사용 여부';
COMMENT ON COLUMN pq_qualification_score_bands.remark IS '비고';
COMMENT ON COLUMN pq_qualification_score_bands.created_at IS '생성 시각';
COMMENT ON COLUMN pq_qualification_score_bands.created_id IS '생성자 ID';
COMMENT ON COLUMN pq_qualification_score_bands.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_qualification_score_bands.last_changed_id IS '최종 변경자 ID';

CREATE INDEX IF NOT EXISTS idx_pq_qualification_score_bands_criterion
    ON pq_qualification_score_bands (criterion_id, sort_order);
