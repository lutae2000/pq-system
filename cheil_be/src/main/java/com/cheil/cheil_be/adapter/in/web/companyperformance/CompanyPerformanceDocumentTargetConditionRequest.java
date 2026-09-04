package com.cheil.cheil_be.adapter.in.web.companyperformance;

import java.util.List;

public record CompanyPerformanceDocumentTargetConditionRequest(
        Long bidSeq,
        List<CompanyPerformanceDocumentTargetCondition> conditions
) {
}
