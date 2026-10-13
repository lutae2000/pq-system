-- 참가제한지역은 API 원문 코드 하나로 관리한다. 기존 목록 컬럼의 값은
-- 신규 단일 코드가 비어 있는 경우에만 보완한 뒤 제거한다.
UPDATE g2b_bid_notice_candidates
   SET prtcpt_lmt_rgn_cd = COALESCE(
           NULLIF(prtcpt_lmt_rgn_cd, ''),
           NULLIF(split_part(prtcpt_lmt_rgn_cds, ',', 1), '')
       )
 WHERE NULLIF(prtcpt_lmt_rgn_cd, '') IS NULL
   AND NULLIF(prtcpt_lmt_rgn_cds, '') IS NOT NULL;

DROP INDEX IF EXISTS ix_g2b_candidates_region_codes;
ALTER TABLE g2b_bid_notice_candidates
    DROP COLUMN IF EXISTS prtcpt_lmt_rgn_cds;
