-- PQ 자격증 코드 마이그레이션
-- PQ_CODE_LIC_202607021427.xlsx 기준

DROP TABLE IF EXISTS certifications CASCADE;

CREATE TABLE certifications (
    cert_code VARCHAR(20) PRIMARY KEY,
    cert_name VARCHAR(200) NOT NULL,
    cert_kind SMALLINT NOT NULL CHECK (cert_kind BETWEEN 0 AND 4),
    satis_code VARCHAR(20),
    satis_name VARCHAR(200),
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

COMMENT ON TABLE certifications IS 'PQ 자격증 코드';
COMMENT ON COLUMN certifications.cert_code IS '자격증 코드';
COMMENT ON COLUMN certifications.cert_name IS '자격증 명';
COMMENT ON COLUMN certifications.cert_kind IS '자격증 구분';
COMMENT ON COLUMN certifications.satis_code IS 'SATIS 코드';
COMMENT ON COLUMN certifications.satis_name IS 'SATIS 명';
COMMENT ON COLUMN certifications.use_yn IS '사용 여부';
COMMENT ON COLUMN certifications.created_at IS '생성 시각';
COMMENT ON COLUMN certifications.created_id IS '생성자 ID';
COMMENT ON COLUMN certifications.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN certifications.last_changed_id IS '최종 변경자 ID';

CREATE INDEX idx_certifications_kind ON certifications (cert_kind);
CREATE INDEX idx_certifications_name ON certifications (cert_name);

-- Source: PQ_CODE_LIC_202607021427.xlsx
INSERT INTO certifications (cert_code, cert_name, cert_kind, satis_code, satis_name, use_yn, created_at, created_id, last_changed_at, last_changed_id)
VALUES
    ('B32', '에너지관리기사', 3, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B01', '일반기계기사', 3, '00086', '일반기계기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A01', '도로및공항기술사', 4, '00222', '도로및공항기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A02', '토목구조기술사', 4, '00216', '토목구조기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A03', '토질및기초기술사', 4, '00226', '토질및기초기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A04', '상하수도기술사', 4, '00288', '상하수도기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A05', '도시계획기술사', 4, '00224', '도시계획기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A06', '항만및해안기술사', 4, '00243', '항만및해안기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A07', '산업기계설비기술사', 4, '00203', '유체기계기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A08', '발송배전기술사', 4, '00277', '발송배전기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A09', '교통기술사', 4, '00218', '교통기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A10', '철도기술사', 4, '00249', '철도기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A11', '건축사', 4, '00273', '건축사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A12', '건축기계설비기술사', 4, '00290', '건축기계설비기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A13', '건축전기설비기술사', 4, '00294', '건축전기설비기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A14', '건축구조기술사', 4, '00289', '건축구조기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A15', '수질관리기술사', 4, '00285', '수질관리기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A16', '대기관리기술사', 4, '00256', '대기관리기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A17', '폐기물처리기술사', 4, '00274', '폐기물처리기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A18', '소음진동기술사', 4, '00298', '소음진동기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A19', '수자원개발기술사', 4, '00223', '수자원개발기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A20', '전자계산조직응용기술사', 4, '00245', '전자계산조직응용기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A21', '조경기술사', 4, '00212', '조경기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A22', '건설안전기술사', 4, '00264', '건설안전기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A23', '지질및지반기술사', 4, '0317', '지질및지반기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A24', '토목시공기술사', 4, '00208', '토목시공기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A25', '전기응용기술사', 4, '00297', '전기응용기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B02', '전기기사', 3, '00007', '전기기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B03', '전기공사기사', 3, '00008', '전기공사기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B04', '건설재료시험기사', 3, '00209', '건설재료시험기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B05', '토목기사', 3, '00122', '토목기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B06', '건축기사', 3, '00103', '건축기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B07', '정보처리기사', 3, '00044', '정보처리기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B08', '도시계획기사', 3, '00228', '도시계획기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B09', '조경기사', 3, '00097', '조경기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B10', '측량및지형공간정보기사', 3, '00300', '측량및지형공간정보기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B11', '지적기사', 3, '00124', '지적기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C01', '일반기계산업기사', 2, '00259', '일반기계기사2급', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C02', '전기산업기사', 2, '00327', '전기기사산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C03', '전기공사산업기사', 2, '00029', '전기공사산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C04', '건설재료시험산업기사', 2, '00210', '건설재료시험산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C05', '토목산업기사', 2, '00140', '토목산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C06', '건축산업기사', 2, '00087', '건축산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C07', '정보처리산업기사', 2, '00045', '정보처리산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C08', '조경산업기사', 2, '00098', '조경산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C09', '측량및지형공간정보산업기사', 2, '00142', '측량및지형정보산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C10', '지적산업기사', 2, '00241', '지적기사2급', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C11', '건설안전산업기사', 2, '00211', '건설안전산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C12', '대기환경산업기사', 2, '00132', '대기환경산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C13', '수질환경산업기사', 2, '00131', '수질환경산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C14', '소음진동산업기사', 2, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C15', '폐기물처리산업기사', 2, '00068', '폐기물처리산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C16', '공정관리산업기사', 2, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C17', '품질관리산업기사', 2, '00149', '품질관리기사2급', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C18', '응용지질산업기사', 2, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C19', '교통산업기사', 2, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B12', '건설안전기사', 3, '00121', '건설안전기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B13', '대기환경기사', 3, '00204', '대기환경기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B14', '수질환경기사', 3, '00005', '수질환경기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B15', '소음진동기사', 3, '00239', '소음진동기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B16', '폐기물처리기사', 3, '00006', '폐기물처리기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B17', '공정관리기사', 3, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B18', '품질관리기사', 3, '00001', '품질관리기사1급', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B19', '응용지질기사', 3, '00217', '응용지질기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B20', '교통기사', 3, '00265', '교통기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B21', '건설기계기사', 3, '00085', '건설기계기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B22', '공조냉동기계기사', 3, '00310', '공조냉동기계기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C20', '공조냉동산업기사', 2, '0332', '공조냉동기계산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('D01', '측량기능사', 1, '00102', '측량기능사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C21', '소방설비산업기사', 2, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('D02', '토목제도기능사', 1, '00253', '토목제도기능사2급', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('D03', '침투비파괴검사기능사', 1, '00299', '침투비파괴검사기능사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('D04', '환경기능사', 1, '00304', '환경기능사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('E01', 'APEC엔지니어', 0, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('D05', '굴삭기운전기능사', 1, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B23', '소방설비기사', 3, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('D06', '건설재료시험기능사', 1, '00101', '건설재료시험기능사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('D07', '지적기능사', 1, '00062', '지적기능사2급', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C22', '철도보선산업기사', 2, '00154', '철도보선산업기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C23', '공업계측제어산업기사', 2, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A26', '측량및지형공간정보기술사', 4, '00309', '측량및지형공간정보기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A27', '건설기계기술사', 4, '00305', '건설기계기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A28', '철도차량기술사', 4, '00316', '철도차량기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A29', '농어업토목기술사', 4, '00318', '농어업토목기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A30', '건축시공기술사', 4, '00291', '건축시공기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A35', '토목품질시험기술사', 4, '00240', '토목품질시험기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C24', '화약류관리산업기사', 2, '00312', '화약류관리기사2급', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B24', '광산보안기사', 3, '00229', '광산보안기사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A31', '공업기계설비기술사', 4, '0309', '산업기계설비기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A32', '토양환경기술사', 4, '0308', '토양환경기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A33', '산업계측제어기술사', 4, '0315', '공업계측제어기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A34', '자연환경관리기술사', 4, '0318', '자연환경관리기술사', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B25', '열관리기사', 3, '00051', '열관리 기사1급', TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A36', '해양기술사', 4, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A38', '소방기술사', 4, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A37', '공조냉동기계기술사', 4, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C25', '화약류관리기술사', 4, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('D10', '기계조립기능사', 1, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B29', '방재기사', 3, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B30', '해양환경기사', 3, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B31', '자연생태복원기사', 3, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B26', '토양환경기사', 3, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('C26', '기계설비산업기사', 2, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('D11', '전산응용기계제도기능사', 1, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('A39', '산업안전기사', 3, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B27', '콘크리트산업기사', 2, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL),
    ('B28', '콘크리트기사', 3, NULL, NULL, TRUE, DEFAULT, NULL, DEFAULT, NULL)
ON CONFLICT (cert_code) DO UPDATE
SET cert_name = EXCLUDED.cert_name,
    cert_kind = EXCLUDED.cert_kind,
    satis_code = EXCLUDED.satis_code,
    satis_name = EXCLUDED.satis_name,
    use_yn = EXCLUDED.use_yn,
    created_at = EXCLUDED.created_at,
    created_id = EXCLUDED.created_id,
    last_changed_at = EXCLUDED.last_changed_at,
    last_changed_id = EXCLUDED.last_changed_id;
