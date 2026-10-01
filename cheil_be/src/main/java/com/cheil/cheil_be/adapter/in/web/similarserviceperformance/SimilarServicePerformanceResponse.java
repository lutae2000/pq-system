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

    public static SimilarServicePerformanceResponse from(
            com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformance model
    ) {
        return new SimilarServicePerformanceResponse(
                model.id(), model.companyPerformanceSeq(), model.serviceName(), model.constructionType(), model.client(),
                model.contractFromDate(), model.contractToDate(), model.constructionFromDate(), model.constructionToDate(),
                model.contractPrice(), model.shareRatio(), model.weight(), model.summary(), model.remark(),
                model.createdAt(), model.createdId(), model.lastChangedAt(), model.lastChangedId()
        );
    }
}
