package com.cheil.cheil_be.application.similarserviceperformance.model;

import java.math.BigDecimal;

public record SimilarServicePerformanceCommand(
        String serviceName,
        String constructionType,
        String client,
        String contractFromDate,
        String contractToDate,
        String constructionFromDate,
        String constructionToDate,
        BigDecimal contractPrice,
        BigDecimal shareRatio,
        BigDecimal weight,
        String summary,
        String remark
) {
}
