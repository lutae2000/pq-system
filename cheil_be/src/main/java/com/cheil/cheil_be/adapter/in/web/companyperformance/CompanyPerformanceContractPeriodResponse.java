package com.cheil.cheil_be.adapter.in.web.companyperformance;

public record CompanyPerformanceContractPeriodResponse(
        Long id,
        Long seq,
        String contractFromDate,
        String contractToDate,
        Integer monthCount,
        Integer dayCount,
        Integer sortSeq
) {
}
