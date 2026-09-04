package com.cheil.cheil_be.adapter.in.web.companyperformance;

public record CompanyPerformanceDocumentTargetCondition(
        String conditionType,
        String logicalOperator,
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
}
