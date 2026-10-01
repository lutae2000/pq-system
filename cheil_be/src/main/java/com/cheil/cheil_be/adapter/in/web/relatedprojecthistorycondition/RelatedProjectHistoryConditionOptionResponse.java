package com.cheil.cheil_be.adapter.in.web.relatedprojecthistorycondition;

import java.util.List;

import com.cheil.cheil_be.application.relatedprojecthistorycondition.ProjectHistoryConditionOptionGroup;

public record RelatedProjectHistoryConditionOptionResponse(
        String conditionCode,
        String valueType,
        List<Option> options
) {
    public static RelatedProjectHistoryConditionOptionResponse from(ProjectHistoryConditionOptionGroup group) {
        return new RelatedProjectHistoryConditionOptionResponse(
                group.conditionCode(),
                group.valueType(),
                group.options().stream().map(option -> new Option(option.value(), option.label())).toList()
        );
    }

    public record Option(String value, String label) {
    }
}
