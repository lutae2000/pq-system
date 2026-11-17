package com.cheil.cheil_be.adapter.in.web.constructionprojectperformance;

import java.math.BigDecimal;

public record ConstructionProjectPerformanceResponse(
        Long id,
        Long constructionProjectPerformanceSeq,
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

    public static ConstructionProjectPerformanceResponse from(
            com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformance model
    ) {
        return new ConstructionProjectPerformanceResponse(
                model.id(), model.constructionProjectPerformanceSeq(), model.serviceName(), model.constructionType(), model.client(),
                model.contractFromDate(), model.contractToDate(), model.constructionFromDate(), model.constructionToDate(),
                model.contractPrice(), model.shareRatio(), model.weight(), model.summary(), model.remark(),
                model.createdAt(), model.createdId(), model.lastChangedAt(), model.lastChangedId()
        );
    }
}
