-- Oracle CHEIL (192.168.2.3): 각 SELECT 결과를 주석의 파일명으로 UTF-8 CSV(헤더 포함) 저장.
-- 11개 파일은 원본 변경이 없는 같은 작업 시간대에 추출한다.
-- RESIDENTNO는 JOIN/정렬에만 사용하며 어느 결과에도 내보내지 않는다.
-- 먼저 검증 결과가 모두 0인지 확인한다.

SELECT 'engineer_orphans_lic' issue, COUNT(*) cnt FROM PQ_ENGR_LIC c LEFT JOIN PQ_ENGR_BASIC p ON p.RESIDENTNO=c.RESIDENTNO WHERE p.RESIDENTNO IS NULL
UNION ALL SELECT 'engineer_orphans_career', COUNT(*) FROM PQ_ENGR_CAREER c LEFT JOIN PQ_ENGR_BASIC p ON p.RESIDENTNO=c.RESIDENTNO WHERE p.RESIDENTNO IS NULL
UNION ALL SELECT 'engineer_orphans_school', COUNT(*) FROM PQ_ENGR_SCHOOL c LEFT JOIN PQ_ENGR_BASIC p ON p.RESIDENTNO=c.RESIDENTNO WHERE p.RESIDENTNO IS NULL
UNION ALL SELECT 'engineer_orphans_prize', COUNT(*) FROM PQ_ENGR_PRIZE c LEFT JOIN PQ_ENGR_BASIC p ON p.RESIDENTNO=c.RESIDENTNO WHERE p.RESIDENTNO IS NULL
UNION ALL SELECT 'engineer_orphans_edu', COUNT(*) FROM PQ_ENGR_EDU c LEFT JOIN PQ_ENGR_BASIC p ON p.RESIDENTNO=c.RESIDENTNO WHERE p.RESIDENTNO IS NULL
UNION ALL SELECT 'engineer_orphans_detail', COUNT(*) FROM PQ_ENGR_CAREERDETAIL c LEFT JOIN PQ_ENGR_BASIC p ON p.RESIDENTNO=c.RESIDENTNO WHERE p.RESIDENTNO IS NULL
UNION ALL SELECT 'company_duplicate_seq', COUNT(*) FROM (SELECT SEQ FROM PQ_COMP_CAREER GROUP BY SEQ HAVING COUNT(*)>1)
UNION ALL SELECT 'company_seq_over_bigint', COUNT(*) FROM PQ_COMP_CAREER WHERE SEQ > 9223372036854775807 OR SEQ < -9223372036854775808
UNION ALL SELECT 'company_orphans_condition', COUNT(*) FROM PQ_COMP_CONDITION c LEFT JOIN PQ_COMP_CAREER p ON p.SEQ=c.SEQ AND p.JOBNAME=c.JOB_NAME WHERE p.SEQ IS NULL
UNION ALL SELECT 'company_orphans_kind', COUNT(*) FROM PQ_COMP_CONKIND c LEFT JOIN PQ_COMP_CAREER p ON p.SEQ=c.SEQ AND p.JOBNAME=c.JOBNAME WHERE p.SEQ IS NULL
UNION ALL SELECT 'company_duplicate_kind', COUNT(*) FROM (SELECT SEQ, JOBNAME, CONKINDBCODE, CONKINDMCODE, CONKINDSCODE FROM PQ_COMP_CONKIND GROUP BY SEQ, JOBNAME, CONKINDBCODE, CONKINDMCODE, CONKINDSCODE HAVING COUNT(*)>1)
UNION ALL SELECT 'school_nonnumeric_career', COUNT(*) FROM PQ_ENGR_SCHOOL WHERE CAREER IS NOT NULL AND NOT REGEXP_LIKE(CAREER, '^[0-9]+$')
UNION ALL SELECT 'award_nonnumeric_prizetag', COUNT(*) FROM PQ_ENGR_PRIZE WHERE PRIZETAG IS NOT NULL AND NOT REGEXP_LIKE(PRIZETAG, '^[0-9]+$')
UNION ALL SELECT 'detail_seq_over_int', COUNT(*) FROM PQ_ENGR_CAREERDETAIL WHERE SEQ > 2147483647 OR SEQ < -2147483648;

-- pq_engineer_master.csv
SELECT TO_CHAR(ROW_NUMBER() OVER (ORDER BY RESIDENTNO)) engr_id,
       NAMEKOR namekor, BIRTHDAY birthday, DEPTNAME deptname, GRADE grade,
       RETIREYN retireyn, DUTYPART dutypart, PROPART propart
FROM PQ_ENGR_BASIC ORDER BY RESIDENTNO;

-- pq_engineer_license.csv
WITH ids AS (SELECT RESIDENTNO, TO_CHAR(ROW_NUMBER() OVER (ORDER BY RESIDENTNO)) engr_id FROM PQ_ENGR_BASIC)
SELECT ids.engr_id, c.DT date_of_issue, c.LICCODE license_code, c.ENTRYNO license_no
FROM PQ_ENGR_LIC c JOIN ids ON ids.RESIDENTNO=c.RESIDENTNO
ORDER BY ids.engr_id, c.DT, c.LICCODE, c.ENTRYNO;

-- pq_engineer_career.csv
WITH ids AS (SELECT RESIDENTNO, TO_CHAR(ROW_NUMBER() OVER (ORDER BY RESIDENTNO)) engr_id FROM PQ_ENGR_BASIC)
SELECT ids.engr_id, c.ENTRYDT entrydt, c.RETIREDT retiredt, c.COMPNAME compname,
       c.DEPTNAME deptname, c.GRADE grade, c.DUTY duty
FROM PQ_ENGR_CAREER c JOIN ids ON ids.RESIDENTNO=c.RESIDENTNO
ORDER BY ids.engr_id, c.ENTRYDT, c.COMPNAME;

-- pq_engineer_school.csv
WITH ids AS (SELECT RESIDENTNO, TO_CHAR(ROW_NUMBER() OVER (ORDER BY RESIDENTNO)) engr_id FROM PQ_ENGR_BASIC)
SELECT ids.engr_id, c.DT graduation_date, c.SCHNAME schname, c.MAJOR major,
       CASE WHEN REGEXP_LIKE(c.CAREER, '^[0-9]+$') THEN TO_NUMBER(c.CAREER) END career,
       c.VALIDMAJORYN valid_major_yn, c.LASTYN last_yn
FROM PQ_ENGR_SCHOOL c JOIN ids ON ids.RESIDENTNO=c.RESIDENTNO
ORDER BY ids.engr_id, c.DT, c.SCHNAME;

-- pq_engineer_award.csv
WITH ids AS (SELECT RESIDENTNO, TO_CHAR(ROW_NUMBER() OVER (ORDER BY RESIDENTNO)) engr_id FROM PQ_ENGR_BASIC)
SELECT ids.engr_id,
       CASE WHEN REGEXP_LIKE(c.PRIZETAG, '^[0-9]+$') THEN TO_NUMBER(c.PRIZETAG) END prizetag,
       c.DT dt, c.KIND kind, c.SPEC spec, c.ORGANNAME organname,
       c.JOBNAME jobname, c.REMARK remark
FROM PQ_ENGR_PRIZE c JOIN ids ON ids.RESIDENTNO=c.RESIDENTNO
ORDER BY ids.engr_id, c.DT, c.KIND;

-- pq_engineer_education.csv
WITH ids AS (SELECT RESIDENTNO, TO_CHAR(ROW_NUMBER() OVER (ORDER BY RESIDENTNO)) engr_id FROM PQ_ENGR_BASIC)
SELECT ids.engr_id, c.STARTDT startdt, c.ENDDT enddt, c.EDUNAME eduname, c.ORGANNAME organname
FROM PQ_ENGR_EDU c JOIN ids ON ids.RESIDENTNO=c.RESIDENTNO
ORDER BY ids.engr_id, c.STARTDT, c.EDUNAME;

-- pq_engineer_project_history.csv
WITH ids AS (SELECT RESIDENTNO, TO_CHAR(ROW_NUMBER() OVER (ORDER BY RESIDENTNO)) engr_id FROM PQ_ENGR_BASIC)
SELECT ids.engr_id, c.SEQ seq, c.STARTDT startdt, c.ENDDT enddt,
       c.JOBCLASS jobclass, c.JOBTAG jobtag, c.JOBPART jobpart,
       c.PROPART propart, c.ENGLEVEL englevel, c.COMPNAME compname,
       c.DEPTNAME deptname, c.GRADE grade, c.DUTY duty, c.RETURNYN returnyn,
       c.JOINYN joinyn, c.REMARK remark
FROM PQ_ENGR_CAREERDETAIL c JOIN ids ON ids.RESIDENTNO=c.RESIDENTNO
ORDER BY ids.engr_id, c.SEQ, c.STARTDT;

-- company_performances.csv
SELECT SEQ seq, JOBSEQ job_seq, JOBNAME job_name, OURYN job_own_yn,
       ALLYN general_management, STARTDT contract_from_date, ENDDT contract_to_date,
       FINISHYN job_finish_yn, STOPDT stop_date, JOBSPEC summary, JOBTYPE job_type,
       JOINTRT job_ratio, CONTAMT contract_amt, OURAMT own_amt, ORDPLACE order_client,
       REMARK remark, ROUND(DIVISION_RATE, 2) division_rate,
       REDPLACE_SEC client_kind, PROJECT_TAG business_type, FOREIGN_TAG oversee_yn
FROM PQ_COMP_CAREER ORDER BY SEQ;

-- company_performance_outlines.csv
SELECT c.SEQ seq, c.OTLN_GSEQ otln_gseq, c.OTLN_LSEQ otln_lseq,
       c.CATE_CODE cate_code, c.SUBCATE_CODE subcate_code, c.CATE_NAME cate_name,
       c.SUBCATE_NAME subcate_name, c.SUBCATE_UNIT subcate_unit, c.OTLN_CONT otln_cont,
       CASE WHEN REGEXP_LIKE(c.SORT_SEQ, '^[0-9]+$') THEN TO_NUMBER(c.SORT_SEQ) END sort_seq
FROM PQ_COMP_CONDITION c
JOIN PQ_COMP_CAREER p ON p.SEQ=c.SEQ AND p.JOBNAME=c.JOB_NAME
ORDER BY c.SEQ, c.OTLN_GSEQ, c.OTLN_LSEQ;

-- company_performance_construction_kinds.csv
SELECT c.SEQ seq, c.CONKINDBCODE level1_code,
       c.CONKINDMCODE level2_code, c.CONKINDSCODE level3_code
FROM PQ_COMP_CONKIND c
JOIN PQ_COMP_CAREER p ON p.SEQ=c.SEQ AND p.JOBNAME=c.JOBNAME
ORDER BY c.SEQ, c.CONKINDBCODE, c.CONKINDMCODE, c.CONKINDSCODE;

-- bid_notices.csv (14자리 원본 일시는 대상 컬럼 길이에 맞춰 자름)
SELECT ROW_NUMBER() OVER (ORDER BY COMPANY_CODE, BID_SEQ, ROWID) bid_seq,
       DEPT_CODE department_code,
       COALESCE(PROJ_NAME, SNAME, '(제목 없음)') project_name,
       ORDER_NAME order_client, DESIGN_AMT design_amt, BID_TAG bid_type,
       SUBSTR(ANNOUNCE_DATE,1,8) announce_date,
       SUBSTR(ENTER_DATE,1,12) pq_regist_date,
       SUBSTR(PQ_DATE,1,12) pq_submit_date,
       BID_METHOD order_method, SUBSTR(BID_DATE,1,12) bid_date,
       BID_SUCESS_YN bid_sucess_yn, PQ_DECIDE_EMPNO pq_decide_empno,
       SUBSTR(PQ_DECIDE_DATE,1,8) pq_decide_date,
       SUPER_DECIDE_EMPNO super_decide_empno, PARTICIPATE_YN participate_yn,
       PROJECT_TAG business_type, SUBSTR(TEND_DATE,1,12) bid_closing_date,
       PROCESS_TAG process_tag, BID_TYPE bid_method,
       SUBSTR(BLTY_EPNT,1,12) bid_submission_date,
       FILD_CODE_CD field_of_work_code, BUSN_BUWE scope_of_work_code,
       ABSE_CASE_CODE_CD reason_of_absence_code,
       SUBSTR(TNDR_RGST_TEND,1,12) site_briefing_date,
       SUBSTR(TP_JECH,1,12) tp_submit_date, TP_PASS_YN tp_pass_yn,
       RPST_VEND prime_contractor, REMK remark, REFMAT_YN refmat_yn
FROM CS_BIDS_NOTICE ORDER BY COMPANY_CODE, BID_SEQ, ROWID;
