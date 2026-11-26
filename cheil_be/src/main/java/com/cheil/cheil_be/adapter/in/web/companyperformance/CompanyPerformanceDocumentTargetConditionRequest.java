package com.cheil.cheil_be.adapter.in.web.companyperformance;

import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import java.util.List;

public record CompanyPerformanceDocumentTargetConditionRequest(
        Long bidSeq,
        List<CompanyPerformanceDocumentTargetCondition> conditions
) {
    List<ProjectHistoryCondition> toQueryConditions() {
        return conditions == null ? null : conditions.stream()
                .map(condition -> condition == null ? null : condition.toQueryCondition())
                .toList();
    }
}
