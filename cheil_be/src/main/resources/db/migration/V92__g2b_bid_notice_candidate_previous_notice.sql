ALTER TABLE g2b_bid_notice_candidates
    ADD COLUMN IF NOT EXISTS bef_bid_bbanc_no VARCHAR(100);

-- 기존에 수집된 원본 응답에서도 이전 입찰번호를 복원합니다.
UPDATE g2b_bid_notice_candidates
   SET bef_bid_bbanc_no = NULLIF(raw_payload ->> 'befBidBbancNo', '')
 WHERE jsonb_typeof(raw_payload) = 'object'
   AND NULLIF(raw_payload ->> 'befBidBbancNo', '') IS NOT NULL;

COMMENT ON COLUMN g2b_bid_notice_candidates.bef_bid_bbanc_no IS
    '재공고의 이전 입찰공고번호. API befBidBbancNo 매핑값';
