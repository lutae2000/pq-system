package com.cheil.cheil_be.adapter.in.web.companyperformance;

import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceDocumentTargetDetails;

public record CompanyPerformanceDocumentTargetResponse(
        Long targetId,
        Long bidSeq,
        Long companyPerformanceSeq,
        Integer displayOrder,
        CompanyPerformanceResponse companyPerformance
) {
    public static CompanyPerformanceDocumentTargetResponse from(CompanyPerformanceDocumentTargetDetails details) {
        var target = details.target();
        return new CompanyPerformanceDocumentTargetResponse(target.targetId(), target.bidSeq(),
                target.companyPerformanceSeq(), target.displayOrder(),
                details.companyPerformance() == null ? null : CompanyPerformanceResponse.from(details.companyPerformance()));
    }
}
