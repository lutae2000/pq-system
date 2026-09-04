package com.cheil.cheil_be.adapter.in.web.companyperformance;

public record CompanyPerformanceDocumentTargetResponse(
        Long targetId,
        Long bidSeq,
        Long companyPerformanceSeq,
        CompanyPerformanceResponse companyPerformance
) {
}
