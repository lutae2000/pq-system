package com.cheil.cheil_be.adapter.in.web.serviceperformance;

import java.math.BigDecimal;

import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceView;

public record ServicePerformanceResponse(
        Long id,
        String clientCode,
        String clientName,
        BigDecimal amountReflectedEvaluationScore,
        String fieldName,
        String siteName,
        String evaluationDate,
        BigDecimal serviceAmount,
        BigDecimal evaluationScore,
        String remark,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {
    static ServicePerformanceResponse from(ServicePerformanceView view) {
        return new ServicePerformanceResponse(
                view.id(), view.clientCode(), view.clientName(), view.amountReflectedEvaluationScore(),
                view.fieldName(), view.siteName(), view.evaluationDate(), view.serviceAmount(),
                view.evaluationScore(), view.remark(), view.createdAt(), view.createdId(),
                view.lastChangedAt(), view.lastChangedId()
        );
    }
}
