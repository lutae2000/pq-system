package com.cheil.cheil_be.application.companyperformance.port.in;

public record CompanyPerformanceSearchCondition(
        String keyword,
        String businessTypeCode,
        String clientKindCode,
        Boolean jobOwnYn,
        String jobFinishYn,
        String contractFromDate,
        String contractToDate,
        Long excludeDocumentTargetBidSeq
) {
}
