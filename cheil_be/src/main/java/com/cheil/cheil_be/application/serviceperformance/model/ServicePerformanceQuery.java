package com.cheil.cheil_be.application.serviceperformance.model;

/** 용역실적 목록 유스케이스에 전달되는 검색 조건이다. */
public record ServicePerformanceQuery(
        String keyword,
        String clientCode,
        String fieldName,
        String siteName,
        String referenceDate,
        String periodType
) {
}
