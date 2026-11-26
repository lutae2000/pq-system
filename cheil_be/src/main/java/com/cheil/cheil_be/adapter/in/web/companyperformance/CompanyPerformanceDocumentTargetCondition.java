package com.cheil.cheil_be.adapter.in.web.companyperformance;

import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;

public record CompanyPerformanceDocumentTargetCondition(
        String conditionType,
        String logicalOperator,
        Integer orGroupStart,
        String label,
        String level1Code,
        String level2Code,
        String level3Code,
        String generalCode,
        String outlineCategoryCode,
        String outlineSubcategoryCode,
        String operator,
        String value,
        String valueTo,
        String valueType
) {
    public ProjectHistoryCondition toQueryCondition() {
        return new ProjectHistoryCondition(conditionType, logicalOperator, orGroupStart, label, level1Code, level2Code,
                level3Code, generalCode, outlineCategoryCode, outlineSubcategoryCode, operator, value, valueTo, valueType);
    }
}
