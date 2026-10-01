package com.cheil.cheil_be.application.similarserviceperformance.model;

public record SimilarServicePerformanceSearch(
        String keyword,
        String constructionType,
        String client,
        String contractFromDate,
        String contractToDate,
        int page,
        int size
) {
}
