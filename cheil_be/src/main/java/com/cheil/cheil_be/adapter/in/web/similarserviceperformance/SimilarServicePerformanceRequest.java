package com.cheil.cheil_be.adapter.in.web.similarserviceperformance;

import java.math.BigDecimal;

public record SimilarServicePerformanceRequest(
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
