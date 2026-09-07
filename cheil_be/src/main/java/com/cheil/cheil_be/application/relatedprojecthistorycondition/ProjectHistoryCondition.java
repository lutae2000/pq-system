package com.cheil.cheil_be.application.relatedprojecthistorycondition;

/** Related project-history filter received from the PQ condition dialog. */
public record ProjectHistoryCondition(
        String conditionType,
        String logicalOperator,
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
}
