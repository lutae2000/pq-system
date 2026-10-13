package com.cheil.cheil_be.domain.g2bbidnotice;

import java.util.List;

/** 나라장터 API에서 수집한 입찰공고 후보입니다. */
public record G2bBidNoticeCandidate(
        Long id,
        String bidNoticeNumber,
        String bidNoticeOrder,
        String previousBidNoticeNumber,
        String noticeKindName,
        String bidMethodName,
        String contractConclusionMethodName,
        String serviceDivisionName,
        String participationLimitRegionCode,
        String commonJointMethodName,
        String successfulBidMethodName,
        String industryLimitYn,
        String publicProcurementMidClassificationName,
        String publicProcurementClassificationName,
        String successfulBidMethodApplicationStandard,
        String assignedBudgetAmount,
        String bidDate,
        String bidSubmissionDate,
        String pqSubmitDate,
        String bidNoticeName,
        String noticeInstitutionName,
        String demandInstitutionName,
        String demandInstitutionCode,
        String bidNoticeDate,
        String bidClosingDate,
        String openingDate,
        String bidNoticeUrl,
        String importedAt,
        Long importedBidSeq,
        List<G2bBidNoticeCandidateAttachment> attachments
) {
}
