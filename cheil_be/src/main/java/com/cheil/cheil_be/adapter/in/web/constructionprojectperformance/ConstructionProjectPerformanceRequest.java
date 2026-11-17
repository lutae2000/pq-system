package com.cheil.cheil_be.adapter.in.web.constructionprojectperformance;

import java.math.BigDecimal;

public record ConstructionProjectPerformanceRequest(
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

    public com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformanceCommand toCommand() {
        return new com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformanceCommand(
                serviceName, constructionType, client, contractFromDate, contractToDate,
                constructionFromDate, constructionToDate, contractPrice, shareRatio,
                weight, summary, remark
        );
    }
}
