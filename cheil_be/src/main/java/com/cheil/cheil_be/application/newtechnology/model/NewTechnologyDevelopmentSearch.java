package com.cheil.cheil_be.application.newtechnology.model;

public record NewTechnologyDevelopmentSearch(
        String keyword,
        String technologyType,
        String targetField,
        String applicationDateFrom,
        String applicationDateTo,
        Boolean useYn,
        String scoreReferenceDate
) {
}
