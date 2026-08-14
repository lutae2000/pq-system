package com.cheil.cheil_be.adapter.in.web.companyperformance;

public record CompanyPerformanceContractPeriodRequest(
        String contractFromDate,
        String contractToDate,
        Integer sortSeq
) {
}
