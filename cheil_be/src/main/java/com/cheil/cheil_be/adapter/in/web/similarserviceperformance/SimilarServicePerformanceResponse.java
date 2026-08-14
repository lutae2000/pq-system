package com.cheil.cheil_be.adapter.in.web.similarserviceperformance;

import java.math.BigDecimal;

public record SimilarServicePerformanceResponse(
        Long id,
        Long companyPerformanceSeq,
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
        String remark,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {
}
