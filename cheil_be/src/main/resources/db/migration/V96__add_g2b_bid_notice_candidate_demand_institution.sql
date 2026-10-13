ALTER TABLE g2b_bid_notice_candidates
    ADD COLUMN IF NOT EXISTS dminstt_nm VARCHAR(300),
    ADD COLUMN IF NOT EXISTS dminstt_cd VARCHAR(100);

UPDATE g2b_bid_notice_candidates
SET dminstt_nm = NULLIF(BTRIM(CASE WHEN jsonb_typeof(raw_payload) = 'array' THEN raw_payload -> -1 ->> 'dminsttNm' ELSE raw_payload ->> 'dminsttNm' END), ''),
    dminstt_cd = NULLIF(BTRIM(CASE WHEN jsonb_typeof(raw_payload) = 'array' THEN raw_payload -> -1 ->> 'dminsttCd' ELSE raw_payload ->> 'dminsttCd' END), '')
WHERE dminstt_nm IS NULL
   OR dminstt_cd IS NULL;

COMMENT ON COLUMN g2b_bid_notice_candidates.dminstt_nm IS '나라장터 수요기관명';
COMMENT ON COLUMN g2b_bid_notice_candidates.dminstt_cd IS '나라장터 수요기관코드';
