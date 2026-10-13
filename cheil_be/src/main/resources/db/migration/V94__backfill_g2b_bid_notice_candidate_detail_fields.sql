-- Backfill columns introduced after the original candidate ingestion started.
-- raw_payload can be either one API item or an array when regional API results
-- for the same notice were merged by the batch.
WITH payload_values AS (
    SELECT candidate.id,
           (array_agg(NULLIF(payload.item ->> 'befBidBbancNo', '') ORDER BY payload.ordinality)
               FILTER (WHERE NULLIF(payload.item ->> 'befBidBbancNo', '') IS NOT NULL))[1] AS previous_bid_notice_number,
           (array_agg(NULLIF(payload.item ->> 'prtcptLmtRgnCd', '') ORDER BY payload.ordinality)
               FILTER (WHERE NULLIF(payload.item ->> 'prtcptLmtRgnCd', '') IS NOT NULL))[1] AS participation_limit_region_code,
           (array_agg(NULLIF(payload.item ->> 'cmmnSpldmdMethdNm', '') ORDER BY payload.ordinality)
               FILTER (WHERE NULLIF(payload.item ->> 'cmmnSpldmdMethdNm', '') IS NOT NULL))[1] AS common_joint_method_name,
           (array_agg(NULLIF(payload.item ->> 'sucsfbidMthdNm', '') ORDER BY payload.ordinality)
               FILTER (WHERE NULLIF(payload.item ->> 'sucsfbidMthdNm', '') IS NOT NULL))[1] AS successful_bid_method_name,
           (array_agg(NULLIF(payload.item ->> 'indstrytyLmtYn', '') ORDER BY payload.ordinality)
               FILTER (WHERE NULLIF(payload.item ->> 'indstrytyLmtYn', '') IS NOT NULL))[1] AS industry_limit_yn,
           (array_agg(NULLIF(payload.item ->> 'pubPrcrmntMidClsfcNm', '') ORDER BY payload.ordinality)
               FILTER (WHERE NULLIF(payload.item ->> 'pubPrcrmntMidClsfcNm', '') IS NOT NULL))[1] AS public_procurement_mid_classification_name,
           (array_agg(NULLIF(payload.item ->> 'pubPrcrmntClsfcNm', '') ORDER BY payload.ordinality)
               FILTER (WHERE NULLIF(payload.item ->> 'pubPrcrmntClsfcNm', '') IS NOT NULL))[1] AS public_procurement_classification_name,
           (array_agg(NULLIF(payload.item ->> 'sucsfbidMthdAppStd', '') ORDER BY payload.ordinality)
               FILTER (WHERE NULLIF(payload.item ->> 'sucsfbidMthdAppStd', '') IS NOT NULL))[1] AS successful_bid_method_application_standard
      FROM g2b_bid_notice_candidates candidate
      CROSS JOIN LATERAL jsonb_array_elements(
          CASE
              WHEN jsonb_typeof(candidate.raw_payload) = 'array' THEN candidate.raw_payload
              ELSE jsonb_build_array(candidate.raw_payload)
          END
      ) WITH ORDINALITY AS payload(item, ordinality)
     WHERE jsonb_typeof(candidate.raw_payload) IN ('object', 'array')
     GROUP BY candidate.id
)
UPDATE g2b_bid_notice_candidates candidate
   SET bef_bid_bbanc_no = COALESCE(NULLIF(candidate.bef_bid_bbanc_no, ''), payload.previous_bid_notice_number),
       prtcpt_lmt_rgn_cd = COALESCE(NULLIF(candidate.prtcpt_lmt_rgn_cd, ''), payload.participation_limit_region_code),
       cmmn_spldmd_methd_nm = COALESCE(NULLIF(candidate.cmmn_spldmd_methd_nm, ''), payload.common_joint_method_name),
       sucsfbid_mthd_nm = COALESCE(NULLIF(candidate.sucsfbid_mthd_nm, ''), payload.successful_bid_method_name),
       indstryty_lmt_yn = COALESCE(NULLIF(candidate.indstryty_lmt_yn, ''), payload.industry_limit_yn),
       pub_prcrmnt_mid_clsfc_nm = COALESCE(NULLIF(candidate.pub_prcrmnt_mid_clsfc_nm, ''), payload.public_procurement_mid_classification_name),
       pub_prcrmnt_clsfc_nm = COALESCE(NULLIF(candidate.pub_prcrmnt_clsfc_nm, ''), payload.public_procurement_classification_name),
       sucsfbid_mthd_app_std = COALESCE(NULLIF(candidate.sucsfbid_mthd_app_std, ''), payload.successful_bid_method_application_standard)
  FROM payload_values payload
 WHERE candidate.id = payload.id
   AND (
       payload.previous_bid_notice_number IS NOT NULL
       OR payload.participation_limit_region_code IS NOT NULL
       OR payload.common_joint_method_name IS NOT NULL
       OR payload.successful_bid_method_name IS NOT NULL
       OR payload.industry_limit_yn IS NOT NULL
       OR payload.public_procurement_mid_classification_name IS NOT NULL
       OR payload.public_procurement_classification_name IS NOT NULL
       OR payload.successful_bid_method_application_standard IS NOT NULL
   );
