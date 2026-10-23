package com.cheil.cheil_be.application.relatedprojecthistory.condition;

public record ProjectHistoryConditionMetadata(
        String table,
        String column,
        String valueType
) {
}
