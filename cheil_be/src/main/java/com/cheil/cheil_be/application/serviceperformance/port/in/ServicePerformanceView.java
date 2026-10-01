package com.cheil.cheil_be.application.serviceperformance.port.in;

import java.math.BigDecimal;

public record ServicePerformanceView(
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
