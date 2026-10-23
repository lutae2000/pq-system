package com.cheil.cheil_be.application.serviceperformance.model;

/** 용역실적 목록 조회에 필요한 정규화된 검색 조건이다. */
public record ServicePerformanceSearch(
        String keyword,
        String clientCode,
        String fieldName,
        String siteName,
        String referenceDate,
        String periodType,
        String periodLowerDate
) {
}
