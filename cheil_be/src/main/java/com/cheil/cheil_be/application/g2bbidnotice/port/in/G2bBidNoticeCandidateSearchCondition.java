package com.cheil.cheil_be.application.g2bbidnotice.port.in;

/** 나라장터 연계 후보 공고 검색조건입니다. */
public record G2bBidNoticeCandidateSearchCondition(
        String bidNoticeNumber,
        String noticeKindName,
        String contractConclusionMethodName,
        String serviceDivisionName,
        String bidNoticeName,
        String noticeInstitutionName,
        String previousBidNoticeNumber,
        String importedYn,
        String relatedBidNoticeNumbers,
        String bidNoticeDateFrom,
        String bidNoticeDateTo,
        boolean orderById
) {
}
