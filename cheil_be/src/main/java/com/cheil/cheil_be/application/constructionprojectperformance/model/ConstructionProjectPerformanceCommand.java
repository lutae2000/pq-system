package com.cheil.cheil_be.application.constructionprojectperformance.model;

import java.math.BigDecimal;

public record ConstructionProjectPerformanceCommand(
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
