package com.cheil.cheil_be.adapter.in.web.serviceperformance;

import java.math.BigDecimal;

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
}
