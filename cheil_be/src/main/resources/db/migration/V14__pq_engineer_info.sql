DROP TABLE IF EXISTS pq_engineer_school CASCADE;
DROP TABLE IF EXISTS pq_engineer_project_history CASCADE;
DROP TABLE IF EXISTS pq_engineer_education CASCADE;
DROP TABLE IF EXISTS pq_engineer_award CASCADE;
DROP TABLE IF EXISTS pq_engineer_career CASCADE;
DROP TABLE IF EXISTS pq_engineer_license CASCADE;
DROP TABLE IF EXISTS pq_engineer_master CASCADE;

CREATE TABLE pq_engineer_master (
    engr_id VARCHAR(20) PRIMARY KEY,
    namekor VARCHAR(100) NOT NULL,
    birthday varchar(8),
    deptname VARCHAR(100),
    grade VARCHAR(50),
    retireyn CHAR(1) NOT NULL DEFAULT 'N',
    dutypart VARCHAR(100),
    propart VARCHAR(100),
    education_exception BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100)
);

COMMENT ON TABLE pq_engineer_master IS '기술자 인사정보';
COMMENT ON COLUMN pq_engineer_master.engr_id IS '기술자 ID';
COMMENT ON COLUMN pq_engineer_master.namekor IS '성명';
COMMENT ON COLUMN pq_engineer_master.birthday IS '생년월일';
COMMENT ON COLUMN pq_engineer_master.deptname IS '부서명';
COMMENT ON COLUMN pq_engineer_master.grade IS '직급';
COMMENT ON COLUMN pq_engineer_master.retireyn IS '퇴직 여부';
COMMENT ON COLUMN pq_engineer_master.dutypart IS '담당 분야';
COMMENT ON COLUMN pq_engineer_master.propart IS '전문 분야';
COMMENT ON COLUMN pq_engineer_master.created_at IS '생성 시각';
COMMENT ON COLUMN pq_engineer_master.created_id IS '생성자';
COMMENT ON COLUMN pq_engineer_master.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_engineer_master.last_changed_id IS '최종 변경자';

CREATE TABLE pq_engineer_license (
    id BIGSERIAL PRIMARY KEY,
    engr_id VARCHAR(20) NOT NULL,
    date_of_issue VARCHAR(8),
    license_code VARCHAR(100),
    license_no VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_pq_engineer_license_basic FOREIGN KEY (engr_id) REFERENCES pq_engineer_master (engr_id) ON DELETE CASCADE
);

COMMENT ON TABLE pq_engineer_license IS '자격증';
COMMENT ON COLUMN pq_engineer_license.id IS '상세 ID';
COMMENT ON COLUMN pq_engineer_license.engr_id IS '기술자 ID';
COMMENT ON COLUMN pq_engineer_license.date_of_issue IS '취득일';
COMMENT ON COLUMN pq_engineer_license.license_code IS '자격증명(코드)';
COMMENT ON COLUMN pq_engineer_license.license_no IS '증서 번호';
COMMENT ON COLUMN pq_engineer_license.created_at IS '생성 시각';
COMMENT ON COLUMN pq_engineer_license.created_id IS '생성자';
COMMENT ON COLUMN pq_engineer_license.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_engineer_license.last_changed_id IS '최종 변경자';

CREATE INDEX idx_pq_engineer_license_engr_id ON pq_engineer_license (engr_id);

CREATE TABLE pq_engineer_career (
    id BIGSERIAL PRIMARY KEY,
    engr_id VARCHAR(20) NOT NULL,
    entrydt VARCHAR(8),
    retiredt VARCHAR(8),
    compname VARCHAR(200),
    deptname VARCHAR(100),
    grade VARCHAR(50),
    duty VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_pq_engineer_career_basic FOREIGN KEY (engr_id) REFERENCES pq_engineer_master (engr_id) ON DELETE CASCADE
);

COMMENT ON TABLE pq_engineer_career IS '경력';
COMMENT ON COLUMN pq_engineer_career.id IS '상세 ID';
COMMENT ON COLUMN pq_engineer_career.engr_id IS '기술자 ID';
COMMENT ON COLUMN pq_engineer_career.entrydt IS '입사일';
COMMENT ON COLUMN pq_engineer_career.retiredt IS '퇴사일';
COMMENT ON COLUMN pq_engineer_career.compname IS '회사명';
COMMENT ON COLUMN pq_engineer_career.deptname IS '부서명';
COMMENT ON COLUMN pq_engineer_career.grade IS '직급';
COMMENT ON COLUMN pq_engineer_career.created_at IS '생성 시각';
COMMENT ON COLUMN pq_engineer_career.created_id IS '생성자';
COMMENT ON COLUMN pq_engineer_career.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_engineer_career.last_changed_id IS '최종 변경자';
COMMENT ON COLUMN pq_engineer_career.duty IS '담당업무';

CREATE INDEX idx_pq_engineer_career_engr_id ON pq_engineer_career (engr_id);

CREATE TABLE pq_engineer_award (
    id BIGSERIAL PRIMARY KEY,
    engr_id VARCHAR(20) NOT NULL,
    prizetag SMALLINT,
    dt VARCHAR(8),
    kind VARCHAR(150),
    spec VARCHAR(100),
    organname VARCHAR(200),
    jobname VARCHAR(200),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_pq_engineer_award_basic FOREIGN KEY (engr_id) REFERENCES pq_engineer_master (engr_id) ON DELETE CASCADE
);

COMMENT ON TABLE pq_engineer_award IS '상훈';
COMMENT ON COLUMN pq_engineer_award.id IS '상세 ID';
COMMENT ON COLUMN pq_engineer_award.engr_id IS '기술자 ID';
COMMENT ON COLUMN pq_engineer_award.prizetag IS '구분값';
COMMENT ON COLUMN pq_engineer_award.dt IS '수상일';
COMMENT ON COLUMN pq_engineer_award.kind IS '상훈 명칭';
COMMENT ON COLUMN pq_engineer_award.spec IS '상훈 번호';
COMMENT ON COLUMN pq_engineer_award.organname IS '수여 기관';
COMMENT ON COLUMN pq_engineer_award.jobname IS '직무명';
COMMENT ON COLUMN pq_engineer_award.remark IS '비고';
COMMENT ON COLUMN pq_engineer_award.created_at IS '생성 시각';
COMMENT ON COLUMN pq_engineer_award.created_id IS '생성자';
COMMENT ON COLUMN pq_engineer_award.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_engineer_award.last_changed_id IS '최종 변경자';

CREATE INDEX idx_pq_engineer_award_engr_id ON pq_engineer_award (engr_id);

CREATE TABLE pq_engineer_education (
    id BIGSERIAL PRIMARY KEY,
    engr_id VARCHAR(20) NOT NULL,
    startdt VARCHAR(8),
    enddt VARCHAR(8),
    eduname VARCHAR(200),
    organname VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_pq_engineer_education_basic FOREIGN KEY (engr_id) REFERENCES pq_engineer_master (engr_id) ON DELETE CASCADE
);

COMMENT ON TABLE pq_engineer_education IS '교육훈련';
COMMENT ON COLUMN pq_engineer_education.id IS '상세 ID';
COMMENT ON COLUMN pq_engineer_education.engr_id IS '기술자 ID';
COMMENT ON COLUMN pq_engineer_education.startdt IS '시작일';
COMMENT ON COLUMN pq_engineer_education.enddt IS '종료일';
COMMENT ON COLUMN pq_engineer_education.eduname IS '교육명';
COMMENT ON COLUMN pq_engineer_education.organname IS '기관명';
COMMENT ON COLUMN pq_engineer_education.created_at IS '생성 시각';
COMMENT ON COLUMN pq_engineer_education.created_id IS '생성자';
COMMENT ON COLUMN pq_engineer_education.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_engineer_education.last_changed_id IS '최종 변경자';

CREATE INDEX idx_pq_engineer_education_engr_id ON pq_engineer_education (engr_id);

CREATE TABLE pq_engineer_project_history (
    id BIGSERIAL PRIMARY KEY,
    engr_id VARCHAR(20) NOT NULL,
    jobname VARCHAR(250),
    seq INTEGER,
    startdt VARCHAR(8),
    enddt VARCHAR(8),
    jobclass VARCHAR(50),
    method VARCHAR(50),
    jobtag VARCHAR(50),
    jobpart VARCHAR(100),
    propart VARCHAR(100),
    englevel VARCHAR(3),
    compname VARCHAR(200),
    deptname VARCHAR(100),
    grade VARCHAR(50),
    duty VARCHAR(100),
    returnyn CHAR(1),
    joinyn CHAR(1),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_pq_engineer_project_history_basic FOREIGN KEY (engr_id) REFERENCES pq_engineer_master (engr_id) ON DELETE CASCADE
);

COMMENT ON TABLE pq_engineer_project_history IS '프로젝트 이력';
COMMENT ON COLUMN pq_engineer_project_history.id IS '상세 ID';
COMMENT ON COLUMN pq_engineer_project_history.engr_id IS '기술자 ID';
COMMENT ON COLUMN pq_engineer_project_history.jobname IS '프로젝트명';
COMMENT ON COLUMN pq_engineer_project_history.seq IS '순번';
COMMENT ON COLUMN pq_engineer_project_history.startdt IS '시작일';
COMMENT ON COLUMN pq_engineer_project_history.enddt IS '종료일';
COMMENT ON COLUMN pq_engineer_project_history.jobclass IS '직종';
COMMENT ON COLUMN pq_engineer_project_history.method IS '수행방식';
COMMENT ON COLUMN pq_engineer_project_history.jobtag IS '직무 태그';
COMMENT ON COLUMN pq_engineer_project_history.jobpart IS '직무 분야';
COMMENT ON COLUMN pq_engineer_project_history.propart IS '전문 분야';
COMMENT ON COLUMN pq_engineer_project_history.englevel IS '기술자 등급';
COMMENT ON COLUMN pq_engineer_project_history.compname IS '회사명';
COMMENT ON COLUMN pq_engineer_project_history.deptname IS '부서명';
COMMENT ON COLUMN pq_engineer_project_history.grade IS '직급';
COMMENT ON COLUMN pq_engineer_project_history.duty IS '업무';
COMMENT ON COLUMN pq_engineer_project_history.returnyn IS '복귀 여부';
COMMENT ON COLUMN pq_engineer_project_history.joinyn IS '참여 여부';
COMMENT ON COLUMN pq_engineer_project_history.remark IS '비고';
COMMENT ON COLUMN pq_engineer_project_history.created_at IS '생성 시각';
COMMENT ON COLUMN pq_engineer_project_history.created_id IS '생성자';
COMMENT ON COLUMN pq_engineer_project_history.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_engineer_project_history.last_changed_id IS '최종 변경자';

CREATE INDEX idx_pq_engineer_project_history_engr_id ON pq_engineer_project_history (engr_id);
CREATE INDEX idx_pq_engineer_project_history_seq ON pq_engineer_project_history (engr_id, seq);

CREATE TABLE pq_engineer_school (
    id BIGSERIAL PRIMARY KEY,
    engr_id VARCHAR(20) NOT NULL,
    graduation_date VARCHAR(8),
    schname VARCHAR(200),
    major VARCHAR(200),
    career SMALLINT,
    valid_major_yn CHAR(1),
    last_yn CHAR(1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_id VARCHAR(100),
    last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_changed_id VARCHAR(100),
    CONSTRAINT fk_pq_engineer_school_basic FOREIGN KEY (engr_id) REFERENCES pq_engineer_master (engr_id) ON DELETE CASCADE
);

COMMENT ON TABLE pq_engineer_school IS '학력';
COMMENT ON COLUMN pq_engineer_school.id IS '상세 ID';
COMMENT ON COLUMN pq_engineer_school.engr_id IS '기술자 ID';
COMMENT ON COLUMN pq_engineer_school.graduation_date IS '졸업일';
COMMENT ON COLUMN pq_engineer_school.schname IS '학교명';
COMMENT ON COLUMN pq_engineer_school.major IS '전공';
COMMENT ON COLUMN pq_engineer_school.career IS '과정';
COMMENT ON COLUMN pq_engineer_school.valid_major_yn IS '전공 유효 여부';
COMMENT ON COLUMN pq_engineer_school.last_yn IS '최종 여부';
COMMENT ON COLUMN pq_engineer_school.created_at IS '생성 시각';
COMMENT ON COLUMN pq_engineer_school.created_id IS '생성자';
COMMENT ON COLUMN pq_engineer_school.last_changed_at IS '최종 변경 시각';
COMMENT ON COLUMN pq_engineer_school.last_changed_id IS '최종 변경자';

CREATE INDEX idx_pq_engineer_school_engr_id ON pq_engineer_school (engr_id);
