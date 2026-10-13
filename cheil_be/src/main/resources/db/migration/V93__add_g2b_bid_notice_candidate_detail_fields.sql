ALTER TABLE g2b_bid_notice_candidates
    ADD COLUMN IF NOT EXISTS prtcpt_lmt_rgn_cd VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cmmn_spldmd_methd_nm VARCHAR(200),
    ADD COLUMN IF NOT EXISTS sucsfbid_mthd_nm VARCHAR(200),
    ADD COLUMN IF NOT EXISTS indstryty_lmt_yn VARCHAR(1),
    ADD COLUMN IF NOT EXISTS pub_prcrmnt_mid_clsfc_nm VARCHAR(200),
    ADD COLUMN IF NOT EXISTS pub_prcrmnt_clsfc_nm VARCHAR(200),
    ADD COLUMN IF NOT EXISTS sucsfbid_mthd_app_std VARCHAR(500);

COMMENT ON COLUMN g2b_bid_notice_candidates.prtcpt_lmt_rgn_cd IS '나라장터 참가제한지역코드';
COMMENT ON COLUMN g2b_bid_notice_candidates.cmmn_spldmd_methd_nm IS '나라장터 공동수급방식명';
COMMENT ON COLUMN g2b_bid_notice_candidates.sucsfbid_mthd_nm IS '나라장터 낙찰방법명';
COMMENT ON COLUMN g2b_bid_notice_candidates.indstryty_lmt_yn IS '나라장터 업종제한여부';
COMMENT ON COLUMN g2b_bid_notice_candidates.pub_prcrmnt_mid_clsfc_nm IS '나라장터 공공조달 중분류명';
COMMENT ON COLUMN g2b_bid_notice_candidates.pub_prcrmnt_clsfc_nm IS '나라장터 공공조달 분류명';
COMMENT ON COLUMN g2b_bid_notice_candidates.sucsfbid_mthd_app_std IS '나라장터 낙찰방법 적용기준';
