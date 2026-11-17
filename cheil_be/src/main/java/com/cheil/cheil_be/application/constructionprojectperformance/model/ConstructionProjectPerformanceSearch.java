package com.cheil.cheil_be.application.constructionprojectperformance.model;

public record ConstructionProjectPerformanceSearch(
        String keyword,
        String constructionType,
        String client,
        String contractFromDate,
        String contractToDate
) {
}
