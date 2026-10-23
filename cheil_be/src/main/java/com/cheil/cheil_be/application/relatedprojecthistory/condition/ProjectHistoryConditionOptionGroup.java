package com.cheil.cheil_be.application.relatedprojecthistory.condition;

import java.util.List;

public record ProjectHistoryConditionOptionGroup(
        String conditionCode,
        String valueType,
        List<ProjectHistoryConditionOption> options
) {
    public ProjectHistoryConditionOptionGroup {
        options = options == null ? List.of() : List.copyOf(options);
    }
}
